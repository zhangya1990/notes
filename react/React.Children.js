//this.props.children表示组件的所有子节点,this.props.children 的值有三种可能：如果当前组件没有子节点，它就是 undefined ;如果有一个子节点，数据类型是 object ；如果有多个子节点，数据类型就是 array
//React.Children，react工具方法，常用的有React.Children.map,React.Children.forEach,React.Children.count,React.children.toArray
import {ReactDOM} from 'react-dom';
class MyTitle extends React.Component{
    constructor(...arg){
        super(...arg);
        this.state = {
            name:'zhang'
        }
    }
    render(){
        return <div>
            {
                React.Children.map(this.props.children,(child)=>{
                    <div>child</div>
                })
            }
        </div>
    }
}
ReactDom.render(<MyTitle>
    <span>hello</span>
    <span>world</span>
        </MyTitle>,
    document.getElementById('APP'));