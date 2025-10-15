import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { capgeminiTheme } from './theme/capgeminiTheme'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ChakraProvider theme={capgeminiTheme}>
      <App />
    </ChakraProvider>
  </ErrorBoundary>
)