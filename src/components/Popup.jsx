import React from "react"
import moment from "moment"

const Popup = ({item, group}) => {
  let dateStart = moment(item.start, 'x')
  let dateEnd = moment(item.end, 'x')

  return (
    <div className="popup">
      <div className="popup-body">
        <h3>{item.title}</h3>
        <div className="item-group"><span style={{fontWeight: 'bold'}}>Group:</span> {group.title}</div>
        <div className="dates">
          <h4>Date</h4>
          <span className="date date-from">
                  From: {dateStart.format('LLL')}
                </span>
          <br/>
          <span className="date date-to">
                  To: {dateEnd.format('LLL')}
                </span>
        </div>
      </div>
    </div>
  )
}

export default Popup