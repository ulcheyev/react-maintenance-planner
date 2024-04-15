import React from "react";
import { FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import "./../assets/Modal.css";

export default class Modal extends React.Component {
  onSubmit = () => {
    this.props.onSubmit();
  };

  onDelete = () => {
    this.props.onDelete();
  };

  render() {
    return (
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{this.props.title}</span>
          <span className="modal-close" onClick={this.props.onClose}>
            <FaPlus />
          </span>
        </div>
        <div className="modal-body">
          {this.props.children}
          <div className="modal-buttons">
            <button className="modal-submit" onClick={this.onSubmit}>
              <FaCheck /> Submit
            </button>
            {this.props.onDelete && (
              <button className="modal-delete" onClick={this.onDelete}>
                <FaTrash /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}