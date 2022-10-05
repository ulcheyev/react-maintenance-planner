import React from "react";
import Constants from "../constants/Constants";

const Legend = ({ title, legendItems }) => {
  let defaultItems = Constants.DEFAULT_LEGEND_ITEMS;

  return (
    <div className="explanatory-notes">
      <h3>{title}</h3>
      <React.Fragment>
        {legendItems.map((item, index) => {
          return (
            <div key={index} className="note">
              <div
                className="legend-color"
                style={{ background: `${item.color}` }}
              />
              <div className="legend-item">{item.name}</div>
            </div>
          );
        })}
        {defaultItems.map((item, index) => {
          return (
            <div key={index} className="note">
              <div
                className="legend-color"
                style={{ background: `${item.color}` }}
              />
              <div className="legend-item">{item.name}</div>
            </div>
          );
        })}
      </React.Fragment>
    </div>
  );
};

export default Legend;
