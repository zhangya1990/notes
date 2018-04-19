import React,{Component} from 'react'

function logger(Com){
    const CurCom = Com;
    class LogProps extends Component{
        componentDidMount(){
            console.log('initial props',this.props)
        }
        componentDidUpdate(prevProps){
            console.log('old props',prevProps);
            console.log('new props',this.props);
        }
        render(){
            const {forwardRef,...rest} = this.props;
            console.log(forwardRef)
            console.log(this.props)
            if(CurCom){
                return (
                    <CurCom ref={forwardRef} {...rest}/>
                )
            }else{
                return null
            }
        }
    }

    function getLogCon(props,ref){
        console.log(arguments)
        return (
            <LogProps forwardRef={ref} {...props}/>
        )
    }

    return React.forwardRef(getLogCon)
}

export default logger