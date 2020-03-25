import * as React from 'react';
import { render } from 'react-dom';
function generateStyles(config:any):{styles:any,className:string} {
    let className = '';
    let styles:any = {};
   
    if (!!config.backgroundColor) {
        styles['backgroundColor'] = config.backgroundColor;
        if (!!config.color) {
            styles['color'] = config.color;
        }
        className = 'bgcolor';

    }
    if (!!config.backgroundImage) {
        styles['backgroundImage'] = `url(${config.backgroundImage})`;
        if (!!config.color) {
            styles['color'] = config.color;
        }
        className='bgimage';

    }
    if (!!config.previewLabel) {
        className += ' withpreview';
    }
    return {styles,className};
}
interface INotification {
    id: string;
    updated: Date;
    message: string;
}
interface INotificationPanelProps {
    notifications:INotification[];
    onReceiveCallbacks:(status:(b:boolean)=>void,notification:(n:INotification[])=>void) => void;
    lucyModel:string;
    apiKey: string;
    accountType:AccountType;
}
interface INotificationPanelState {
    selectedNotification?:INotification;
    notifications:INotification[];
    show:boolean;
    showEditor:boolean;
}
interface INotificationEditorState {
    backgroundColor:string;
    color:string;
    backgroundImage:string;
    titleLabel:string;
    titleValue:string;
    fields:{label:string,value:string}[];
    previewLabel:string;
    previewValue:string;
    message:string;
    to:string;
    toType:string;//'account' | 'allaccounts' | 'myaccount';'
}

interface INotificationEditorProps {
    onCancel:()=>void;
    lucyModel:string;
    apiKey: string;
    accountType:string;
}
class NotificationEditor extends React.Component<INotificationEditorProps,INotificationEditorState> {
    constructor(props:INotificationEditorProps) {
        super(props);
        this.state = {
            backgroundColor:'#06F',
            color:'white',
            backgroundImage:'',
            titleLabel:'',
            titleValue:'',
            fields:[],
            previewLabel:'',
            previewValue:'',
            message:'',
            to:'',
            toType:'all',
        }
    }
    async save() {
        let url = `/Lucy/${this.props.lucyModel}/SendNotification`;
        let {
            backgroundColor,
            backgroundImage,
            color,
            fields,
            
            message,
            titleLabel,
            titleValue,
        } = this.state;
        let previewLabel = '';
        let previewValue  = '';
        if (fields.length>0) {
            previewLabel = fields[0].label;
            previewValue = fields[0].value;
        }

        let payload = {
            backgroundColor,
            backgroundImage,
            color,
            fields,
            previewLabel,
            previewValue,
            message,
            titleLabel,
            titleValue,
        };
        let data = {
            to:this.state.to,
            toType:this.state.toType,
            payload
        };
        let response = await fetch(url, {
            method: 'POST',
            headers: {
        'Authorization':`APIKEY ${this.props.apiKey}`,
        'Content-Type': 'application/json',
            }, body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw (await response.text());
        }

    }
    onSave() {
        this.save()
        .then(()=>{
            this.props.onCancel();
        })
        .catch(e => alert(e));
    }
    renderTo() {
        let options = [];
        if (this.props.accountType == 'landlord') {
            options.push(<option value={'all:users'}>All Tenants</option>);
            options.push(<option value={'all:fm'}>All FM Users from all tenants</option>);
            options.push(<option value={'tenant:users'}>Users for these Tenants</option>);
            options.push(<option value={'tenant:fm'}>FM Users for these Tenants</option>);
            options.push(<option value={'all'}>All Staff</option>);
            options.push(<option value={'users'}>Users</option>);

        } else {
            options.push(<option value={'all'}>All Staff</option>);
            options.push(<option value={'users'}>Users</option>);
        }
        return <div className='to-controls'>
                <span>To:</span>
                <select value={this.state.toType} onChange={(e)=>this.setState({toType:e.target.value})}>
                  {[options]}
                </select>
                {
                    (this.state.toType=='tenant:users' || this.state.toType=='tenant:fm' || this.state.toType=='users')
                    ?
                    <input type='text' placeholder={
                        this.state.toType.startsWith('tenant:')?'Enter tenant names':
                        'Enter email addresses'
                     
                    } value={this.state.to} onChange={(e)=>this.setState({to:e.target.value})} />
                    :null
                }
               
        </div>;
    }
    renderEditControls() {
        return <div className='edit-controls'>
            <div className='lbl'>
            <div className='save' onClick={()=>this.onSave()}>Send</div>
            <div className='cancel' onClick={()=>this.props.onCancel()}>Cancel</div>
            </div>
            <div className='lbl'>
                Background Color <input placeholder='Hex or Web Color' type='text' value={this.state.backgroundColor} onChange={(e)=>this.setState({backgroundColor:e.target.value})} />
            </div>
            <div className='lbl'>
                Background Image <input placeholder='Image Url' type='text' value={this.state.backgroundImage} onChange={(e)=>this.setState({backgroundImage:e.target.value})} />
            </div>
            <div className='lbl'>
                Text Color <input type='text' value={this.state.color} onChange={(e)=>this.setState({color:e.target.value})} />
            </div>


        </div>
    }
    render() {
        let {styles,className} = generateStyles(this.state);
        let inputStyle:any = {};
        if (!!styles.color) {
            inputStyle['color'] = styles.color;
        }
        return <div className={'uxp-n-editor-container'}>
            <div className={'uxp-n-content ' + className}>
                <div className='uxp-n-content-header' style={styles}>
                    <input type='text' style={inputStyle} className='title-label-editor' placeholder='Title' value={this.state.titleLabel} onChange={(e)=>this.setState({titleLabel:e.target.value})} />
                    <input type='text' style={inputStyle} className='title-value-editor' placeholder='Subject'  value={this.state.titleValue} onChange={(e)=>this.setState({titleValue:e.target.value})} />
                    {
                        this.renderTo()
                    }
                    {
                        this.renderEditControls()
                    }
                </div>
                <div className='add-field' onClick={()=>this.addField()}>Add Field</div>
                <div className={'uxp-n-content-body'}>
                {
                    this.state.fields.map( (f:{label:string,value:string},i:number) => this.renderField(f,i))
                } 

                <div className={'uxp-n-content-text'}>
                    {
                        <textarea placeholder='Description...' className='message-editor' value={this.state.message} onChange={(e)=>this.setState({message:e.target.value})} />
                    }
                </div>
            </div>
            </div>
        </div>;
    }
    renderField(field:{label:string,value:string},i:number) {
        return <div className='uxp-n-content-field'>
        <input type='text' placeholder='Name' onChange={(e)=>this.updateField(i,e.target.value,field.value)} value={field.label} className='field-label' />
        <input type='text' placeholder='Value'  onChange={(e)=>this.updateField(i,field.label,e.target.value)}   value={field.value} className='field-value' />
        <div className='deleter' onClick={(e)=>this.removeField(i)}  dangerouslySetInnerHTML={{__html: '&#xd7;'}}></div>
    </div>;
    }
    updateField(i:number,label:string,value:string) {
        let fields = this.state.fields.slice();
        fields[i] = {label,value};
        this.setState({fields});
    }
    removeField(i:number) {
        let fields = this.state.fields.slice();
        fields.splice(i,1);
        this.setState({fields});
    }
    addField() {
        let fields = this.state.fields.slice();
        fields.push({label:'',value:''});
        this.setState({fields});
    }
}
class NotificationPanel extends React.Component<INotificationPanelProps,INotificationPanelState> {
    sheetEl:HTMLDivElement;
    constructor(props:INotificationPanelProps) {
        super(props);
        this.state = {
            selectedNotification:null,
            notifications:this.props.notifications,
            show:false,
            showEditor:false,

        };

    }
    componentDidMount() {
        this.props.onReceiveCallbacks(
            (b)=>{
                this.setState({show:b});
            },
            (n) => {
                this.setState({notifications:n});
            }
        );

    }
    
    
    renderNotificationPreview(n:INotification) {
        let body:any;
        try {
            body = JSON.parse(n.message);

        }catch(e) {
            console.log(e,n.message);
            return <div className='uxp-n-preview-error'>A parsing error occurred</div>
        }

        let {styles,className} = generateStyles(body);
        return <div className={'uxp-n-preview-container ' + (n==this.state.selectedNotification?'selected':'')}>
            <div className={'uxp-n-preview ' + className} onClick={()=>this.setState({selectedNotification:n})}>
            <div className={'uxp-n-preview-header'} style={styles}>
                <div className='title-label'>{body.titleLabel}</div>
                <div className='title-value'>{body.titleValue}</div>
            </div>
            <div className={'uxp-n-preview-body'}>
                <div className='preview-label'>{body.previewLabel}</div>
                <div className='preview-value'>{body.previewValue}</div>
            </div>
        </div></div>;
       
    }
    render() {
        if (this.state.showEditor) {
            return <div ref={(r)=>this.sheetEl = r}  className={'uxp-n-sheet ' + (this.state.show?'':'invisible')} onClick={(e)=>{
                if (e.target === this.sheetEl) {
                    this.setState({show:false})
                }
            }} >
                <NotificationEditor accountType={this.props.accountType} lucyModel={this.props.lucyModel} apiKey={this.props.apiKey} onCancel={()=>this.setState({showEditor:false})} />
            </div>;
        }
        return <div ref={(r)=>this.sheetEl = r}  className={'uxp-n-sheet ' + (this.state.show?'':'invisible')} onClick={(e)=>{
            if (e.target === this.sheetEl) {
                this.setState({show:false})
            }
        }} >
            <div className='uxp-n-container'>

                <div className='uxp-n-sidebar'>
                    <div className='compose' onClick={()=>this.setState({showEditor:true})}>Compose</div>
                {
                    this.state.notifications.map(n => this.renderNotificationPreview(n))
                }
                </div>
                <div className='uxp-n-content'>
                    {this.renderSelectedNotification()}
                </div>
            </div>
        </div>;
    }
    renderSelectedNotification() {
        if (!this.state.selectedNotification) return  <div className='nodata'>Nothing to show!</div>;
        let n = this.state.selectedNotification;
        let body:any;
        try {
            body = JSON.parse(n.message);

        }catch(e) {
            console.log(e,n.message);
            return <div className='uxp-n-content-error'>A parsing error occurred</div>
        }
        let fields = body.fields || [];
        let {styles,className} = generateStyles(body);
        return <div className={'uxp-n-content ' + className} onClick={()=>this.setState({selectedNotification:n})}>
            <div className={'uxp-n-content-header'} style={styles}>
                <div className='title-label'>{body.titleLabel}</div>
                <div className='title-value'>{body.titleValue}</div>
            </div>
            <div className={'uxp-n-content-body'}>
                {
                    fields.map( (f:{label:string,value:string}) => this.renderField(f))
                }
               
                <div className={'uxp-n-content-text'}>
                    {
                        body.message || ''
                    }
                </div>
            </div>
        </div>;
    }
   
    renderField(field:{label:string,value:string}) {
        return <div className='uxp-n-content-field'>
            <div className='field-label'>{field.label}</div>
            <div className='field-value'>{field.value}</div>
        </div>;
    }
}
let setNotificationStatus:(show:boolean)=>void = null;
let updateNotificationList:(notifications:INotification[]) => void;
export function showNotifications() {
    if (setNotificationStatus) {
        setNotificationStatus(true);
    }
}
export function hideNotifications() {
    if (setNotificationStatus) {
        setNotificationStatus(false);
    }
}
export function updateNotifications(notifications:INotification[]) {
    if (updateNotificationList) {
        updateNotificationList(notifications);
    }
}
type AccountType = 'landlord' | 'tenant';

export function setupNotifications(lucyModel:string,apiKey:string,notifications:INotification[],accountType:AccountType) {
    let el = document.createElement('div');
    el.classList.add('uxp-n-placeholder');
    document.querySelector('body').append(el);
    render(<NotificationPanel  
        lucyModel={lucyModel}
        apiKey={apiKey}
        accountType={accountType}
        notifications={notifications} 
        onReceiveCallbacks={(status,notification) => {
        updateNotificationList = notification;
        setNotificationStatus = status;
    }}
     />,el);
}