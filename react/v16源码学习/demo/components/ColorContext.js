

import React,{Component,createContext} from 'react'

const ColorContext = createContext('red');
console.log(ColorContext)

function Color(props) {
  const childColor = color => {
    return (
      <div style={{ color }}>
        hahahahahahahahaha
      </div>
    )
  }
  return (
    <ColorContext.Consumer>
      {childColor}
    </ColorContext.Consumer>
  )
}


class ColorContainer extends Component{
  showHaha(){
    alert('hahahahahahahahaha')
  }
  render(){
    const color = this.props.color;
    return (
      <ColorContext.Provider value={color}>
        <Color {...this.props}></Color>
      </ColorContext.Provider>
    )
  }
}


export default ColorContainer