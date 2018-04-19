import React, { Component, createContext, createRef } from 'react';
import logo from './logo.svg';
// import GetNode from './components/GetNode'
import ColorContainer from './components/ColorContext';
import Logger from './components/Hoc';
import Second from './components/Second';
import './App.css';

console.log(React)

const ColorLogger = Logger(ColorContainer);

var instance;

class App extends Component {
  constructor(props) {
    super(props)
    instance = this;
  }
  curRef = createRef();
  state = { count: 0 };
  consoleCount = ()=>{
    console.log(this.state.count)
  }

  handleCount = () => {
    this.setState({ count: this.state.count + 1 })
  }
  render() {
    console.log('render:     '+this.state.count)
    return (
      <div className="App" onClick={this.handleCount}>
        {/* {ColorLogger.render()} */}
        {/* <ColorLogger ref={this.curRef} /> */}

        {/* <div className="childDiv">woshizijiedian</div>
        <Second count={this.state.count} /> */}
      </div>
    );
  }


  componentWillMount() {
    // debugger;
    console.log('componentWillMount1:     '+this.state.count)
    this.setState({ count: this.state.count + 1 },this.consoleCount);
    console.log('componentWillMount2:     '+this.state.count)
    this.setState({ count: this.state.count + 1 },this.consoleCount);
    console.log('componentWillMount3:     '+this.state.count)
    // debugger;
  }

  componentDidMount() {
    // console.log(this.getNode)
    // console.log(this.curRef.current)
    // this.curRef.current.showHaha();

    // debugger;
    /* console.log('componentDidMount1:     '+this.state.count)
    this.setState({ count: this.state.count + 1 },this.consoleCount);
    console.log('componentDidMount2:     '+this.state.count)
    this.setState({ count: this.state.count + 1 },this.consoleCount);
    console.log('componentDidMount3:     '+this.state.count) */

    // setTimeout(() => {
    //   // debugger;
    //   console.log(this.state.count)
    //   this.setState({ count: this.state.count + 1 },this.consoleCount);
    //  /*  console.log(this.state.count)
    //   this.setState({ count: this.state.count + 1 },this.consoleCount);
    //   console.log(this.state.count) */
    // }, 0)
  }

  componentWillUpdate() {
    // debugger;
    console.log('componentWillUpdate1:     '+this.state.count)
   /*  this.setState({ count: this.state.count + 1 },this.consoleCount);
    console.log('componentWillUpdate2:     '+this.state.count)
    this.setState({ count: this.state.count + 1 },this.consoleCount);
    console.log('componentWillUpdate3:     '+this.state.count) */
  }

  componentDidUpdate() {
    // debugger;
   /*  console.log('componentDidUpdate1:     '+this.state.count)
    this.setState({ count: this.state.count + 1 },this.consoleCount);
    console.log('componentDidUpdate2:     '+this.state.count)
    this.setState({ count: this.state.count + 1 },this.consoleCount);
    console.log('componentDidUpdate3:     '+this.state.count) */
  }

  getSnapshotBeforeUpdate(){
    console.log(['getSnapshotBeforeUpdate',arguments])
    // this.setState({ count: this.state.count + 1 },this.consoleCount);
  }

  static getDerivedStateFromProps = (...arg)=>{
    console.log(['getDirevedStateFromProps',arg])
    var _this = instance;
    debugger
    _this.setState({ count: _this.state.count + 1 });
  }

}


export default App;
