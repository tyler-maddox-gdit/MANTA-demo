import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mantaSource } from '@usps/508-toolkit/babel';

// mantaSource stamps each element with the source file and lines that wrote it (data-manta-src),
// which MANTA reads off the page so a fix can name a file and line. build: true stamps the
// production build too, since CI scans `vite preview`.
export default defineConfig({ plugins: [react({ babel: { plugins: [mantaSource({ build: true })] } })], appType: 'spa' });
