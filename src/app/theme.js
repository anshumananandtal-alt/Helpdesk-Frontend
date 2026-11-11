import { createTheme } from '@mui/material/styles'

export const colors = {
  ink: '#17233c',
  muted: '#78839a',
  line: '#e8ecf3',
  navy: '#172b4d',
  teal: '#18a5a5',
}

const theme = createTheme({
  palette: {
    background: { default: '#f7f9fc' },
    primary: { main: colors.navy },
    text: { primary: colors.ink, secondary: colors.muted },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minWidth: 320, backgroundColor: '#f7f9fc' },
        '#root': { minHeight: '100vh' },
      },
    },
  },
})

export default theme
