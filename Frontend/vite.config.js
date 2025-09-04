import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import compression from 'vite-plugin-compression'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react(),
      // Legacy browser support for production
      isProduction && legacy({
        targets: ['defaults', 'not IE 11']
      }),
      // Gzip compression for production
      isProduction && compression({
        algorithm: 'gzip',
        ext: '.gz'
      }),
      // Brotli compression for production
      isProduction && compression({
        algorithm: 'brotliCompress',
        ext: '.br'
      })
    ].filter(Boolean),
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@tabler/icons-react', 'motion']
          }
        }
      },
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      } : undefined
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      port: 4173,
      host: true
    }
  }
})
