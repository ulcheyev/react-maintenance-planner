import React from "react"
import {FaPlus} from 'react-icons/fa'
import './../assets/Modal.css'

export default class Modal extends React.Component {
  onSubmit = () => {
    this.props.onSubmit()
  }

  render() {
    return (
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{this.props.title}</span>
          <span className="modal-close" onClick={this.props.onClose}><FaPlus/></span>
        </div>
        <div className="modal-body">
          {this.props.children}
          <button className="modal-submit" onClick={this.onSubmit}>
            Submit
          </button>
        </div>
      </div>
    )
  }
}