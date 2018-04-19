import React,{Component} from 'react'
import PropTypes from 'prop-types'

export default class Second extends Component{
    static propTypes={
        count:PropTypes.number.isRequired
    }
    state={name:'haha'};
    onMouseEnter=()=>{
        console.log('mouseEnter')
    }
    render(){
        return (
            <div className="second" onMouseEnter={this.onMouseEnter}>
                这是: {this.state.name}
                <br/>
                count: {this.props.count}
            </div>
        )
    }
}

