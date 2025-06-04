import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';

// Load Gemini API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const queue = new Queue('file-upload-queue', {
  connection: { host: 'localhost', port: '6379' },
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${suffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ status: 'All Good!' }));

app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
  try {
    await queue.add('file-ready', JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    }));
    res.json({ message: 'uploaded' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/chat', async (req, res) => {
  try {
    const userQuery = String(req.query.message || '');
    
    if (!userQuery.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize embeddings with Gemini
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: GEMINI_API_KEY,
      model: 'text-embedding-004', // Updated embedding model
    });

    // Load existing Qdrant collection
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: 'http://localhost:6333',
      collectionName: 'langchainjs-testing',
    });

    // Retrieve top-k docs
    const retriever = vectorStore.asRetriever({ k: 2 });
    const docs = await retriever.invoke(userQuery);

    // Format context from retrieved documents
    const context = docs.map((doc, index) => 
      `Document ${index + 1}:\n${doc.pageContent}`
    ).join('\n\n');

    const systemPrompt = `You are a helpful AI assistant. Use the following PDF context to answer the user's question. If the context doesn't contain relevant information, say so politely.

Context:
${context}`;

    // Initialize Chat model with updated Gemini model
    const chatModel = new ChatGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
      model: 'gemini-1.5-flash', // Updated to current model
      temperature: 0.7,
    });

    // Invoke chat with proper message format
    const answer = await chatModel.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery },
    ]);

    res.json({ 
      message: answer.content, 
      docs: docs.map(doc => ({
        content: doc.pageContent,
        metadata: doc.metadata
      }))
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

app.listen(8000, () => console.log('Server started on PORT: 8000'));