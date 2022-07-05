import React from "react";
import "./popup.scss";

const Popup = props => {
  const currentProps = {
    data: {},
    title: "Popup larchiveum",
    size: 'lg',
    content: <p>Wellcome to larchiveum</p>,
    closeButton: true,
    actions: []
  }

  currentProps.data = props.data || currentProps.data;
  currentProps.title = props.title || currentProps.title;
  currentProps.size = props.size || currentProps.size;
  currentProps.content = props.content || currentProps.content;
  currentProps.closeButton = props.closeButton || currentProps.closeButton;
  currentProps.actions = props.actions || currentProps.actions;
  currentProps.handleClose = props.handleClose || currentProps.handleClose;
  
  return (
    <div className="popup-overlay">
      <div className={'popup-content ' + currentProps.size}>
        <div className="modal">
          {currentProps.closeButton = true ? 
            <button className="close" onClick={currentProps.handleClose}>
              &times;
            </button>
          :''}
          <div className="header"> {currentProps.title}</div>
          <div className="content">
              {currentProps.content}
          </div>
          <div className="actions">
            {currentProps.actions.map((action, i)=>{
              if(!action.hidden){
                return <button key={i}
                    className={action.class}
                    onClick={()=>{action.callback(currentProps.data)}} 
                    disabled={action.disabled || false}
                >{action.text}</button>
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default Popup;