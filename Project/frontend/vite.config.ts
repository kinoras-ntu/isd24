import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    server: {
        proxy: {
            '/video_feed': 'http://127.0.0.1:5000',
            '/nodes': 'http://127.0.0.1:5000'
        }
    }
})
