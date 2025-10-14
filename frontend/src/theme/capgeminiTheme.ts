import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const colors = {
  brand: {
    50: '#E8F4FD',
    100: '#C1E2F9',
    200: '#9AD1F4',
    300: '#73BFEF',
    400: '#4CADEA',
    500: '#259CE5', // Capgemini Blue
    600: '#1D7DB7',
    700: '#165E89',
    800: '#0E3E5C',
    900: '#071F2E',
  },
  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },
}

const fonts = {
  heading: `'Segoe UI', system-ui, sans-serif`,
  body: `'Segoe UI', system-ui, sans-serif`,
}

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
        },
      },
      outline: {
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
      },
    },
    defaultProps: {
      variant: 'solid',
    },
  },
  Tabs: {
    variants: {
      enclosed: {
        tab: {
          border: '1px solid',
          borderColor: 'transparent',
          borderBottom: 'none',
          mb: '-1px',
          _selected: {
            color: 'brand.500',
            borderColor: 'brand.200',
            borderBottomColor: 'white',
            bg: 'white',
          },
          _hover: {
            bg: 'brand.50',
          },
        },
        tabpanel: {
          border: '1px solid',
          borderColor: 'brand.200',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 'md',
          borderBottomRadius: 'md',
        },
      },
    },
    defaultProps: {
      variant: 'enclosed',
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        boxShadow: 'lg',
        borderRadius: 'lg',
        border: '1px solid',
        borderColor: 'gray.200',
      },
    },
  },
}

const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
    },
  },
}

export const capgeminiTheme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles,
})