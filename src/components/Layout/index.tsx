import React from 'react'
import styled from 'styled-components'

export type ILayout = {
  side: React.ReactElement
  main: React.ReactElement
}

function Layout(props: ILayout) {
  return (
    <Container>
      <Side>{props.side}</Side>
      <Main>{props.main}</Main>
    </Container>
  )
}

export default Layout

const Container = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 100%;
  width: 100%;
`
const Main = styled.div`
  flex-direction: column;
  flex: 1;
  height: 100%;
`
const Side = styled.div`
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  width: 250px;
  z-index: 2;
`
