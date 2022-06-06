import React from "react"
import moment from "moment"
import ProgressBar from "./ProgressBar";

const Popup = ({item, group}) => {
  let dateStart = moment(item.start, 'x');
  let dateEnd = moment(item.end, 'x');

  const getTaskProgress = () => {
      const plannedWorkedTime = item.plannedWorkTime;
      const workedTime = item.workTime;
      const taskProgress = (workedTime/plannedWorkedTime);
      if (!taskProgress) return 0;
      return taskProgress;

    }

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
        <div>
            <p>
                Task progress: {getTaskProgress() ?
                (getTaskProgress() * 100) + "%"
                :
                "Not defined"}
            </p>
            {<ProgressBar progress={getTaskProgress()}/>}
        </div>
    </div>
  )
}

export default Popup