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
          <span className="title">{this.props.title}</span>
          <span className="close" onClick={this.props.onClose}><FaPlus/></span>
        </div>
        <div className="modal-body">
          {this.props.children}
          <button className="submit" onClick={this.onSubmit}>
            Submit
          </button>
        </div>
      </div>
    )
  }
}