import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './Components/Header/Header'
import Footer from './Components/Footer/Footer'
import PostList from './Components/Postlist/Postlist'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Header/>
    <PostList/>
    <Footer/>
    </>
  )
}

export default App
