import WorldMap from './components/WorldMap';
import SankeyChart from './components/Sankey';
import ScatterPlot from './components/ScatterPlot';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { Typography } from '@mui/material';

// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    primary:{
      main: grey[700],
    },
    secondary:{
      main: grey[700],
    }
  },
})

// For how Grid works, refer to https://mui.com/material-ui/react-grid/

function Layout() {
  return (
    <Box id='main-container' sx={{backgroundColor:'#fcfcfc'}}>
      <Stack spacing={1} sx={{ height: '100%', overflow: 'hidden' }}>
        <Box sx={{ py: 1, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: '#333',
          letterSpacing: '1px',
          fontSize: { xs: '1rem', md: '1.2rem' } 
        }}>
          Paris 2024: Global Medal Distribution & Aquatic Sports Performance Analysis
        </Typography>
      </Box>
        {/* Top row: Example component taking about 60% width */}
        <Grid container spacing={1} sx={{ height: '100%', overflow: 'hidden' }}>
          <Grid size={7} sx={{ height: '100%'}}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#fcfcfc' }}>
              <WorldMap />
            </Box>
          </Grid>
          {/* flexible spacer to take remaining space */}

          {/* right column */}
          <Grid size={5} sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1, 
            alignItems: 'center', 
            justifyContent: 'center',
          }}>
            
            {/* 右侧上半部分：放置 SankeyChart */}
            <Box sx={{ 
              flex: 1,           
              width: '85.3%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: '#fcfcfc',
              borderRadius: 1
            }}>
              <SankeyChart />
            </Box>

            {/* 右侧下半部分：可以放 Notes 或留空 */}
            <Box sx={{ 
              flex: 1,
              width: '80%',
              bgcolor: '#fcfcfc',
              borderRadius: 1,
              p: 2
            }}>
              <ScatterPlot />

            </Box>

          </Grid>
        </Grid>
        {/* Bottom row: Notes component taking full width */}
        {/* <Grid size={12} sx={{ height: '40%' }}> */}
          {/* <Notes msg={"This is a message sent from App.tsx as component prop"} /> */}
          { /* Uncomment the following to see how state management works in React.
            <CountProvider>
              <NotesWithReducer msg={"This is a message sent from App.tsx as component prop"} />
            </CountProvider>
          */ }
        {/* </Grid> */}


      </Stack>
    </Box>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  )
}

export default App
