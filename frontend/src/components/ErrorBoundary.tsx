import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Text, Button, VStack, Alert, AlertIcon } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box h="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
          <VStack spacing={6} maxW="md" textAlign="center" p={6}>
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold">Something went wrong</Text>
                <Text fontSize="sm">The application encountered an unexpected error.</Text>
              </VStack>
            </Alert>
            
            <Button 
              colorScheme="brand" 
              onClick={() => window.location.reload()}
            >
              Reload Application
            </Button>
            
            {this.state.error && (
              <Box bg="gray.100" p={3} borderRadius="md" fontSize="xs" color="gray.600" maxW="full" overflow="auto">
                <Text fontWeight="bold">Error Details:</Text>
                <Text>{this.state.error.message}</Text>
              </Box>
            )}
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}