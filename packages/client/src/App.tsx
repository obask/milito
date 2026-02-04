import type { ParentProps } from 'solid-js'
import Header from './components/Header'

export default function App(props: ParentProps) {
  return (
    <>
      <Header />
      {props.children}
    </>
  )
}
