import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { config } from './config';
import { initSocket } from './socket';
import { startSlaMonitor } from './jobs/slaMonitor';
import { isAzureConfigured, getProviderLabel } from './agents/aiProviderImpl';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import approvalRoutes from './routes/approvals';
import documentRoutes from './routes/documents';
import agentRoutes from './routes/agents';
import auditRoutes from './routes/audit';
import emailRoutes from './routes/email';
import clmRoutes from './routes/clm';
import kbRoutes from './routes/kb';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import intakeRoutes from './routes/intake';

const app = express();
const server = http.createServer(app);

initSocket(server, config.frontendUrl);

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CoSora API',
    aiConfigured: isAzureConfigured(),
    aiProvider: isAzureConfigured() ? getProviderLabel() : 'mock',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/clm', clmRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks/intake', intakeRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

startSlaMonitor();

server.listen(config.port, () => {
  console.log(`CoSora API running on http://localhost:${config.port}`);
});

export default app;
