/*import Timeline, {
  TimelineMarkers,
  CustomMarker,
} from 'react-calendar-timeline'*/
// import moment from 'moment'
// import './App.css';
import PlanningTool from "./components/PlanningTool.js";

// const data = require('./test.json');


/*const groups = [{ id: 1, title: 'group 1' }, { id: 2, title: 'group 2' }]

const items = [
  {
    id: 1,
    group: 1,
    title: 'item 1',
    start_time: moment(),
    end_time: moment().add(1, 'day')
  },
  {
    id: 2,
    group: 2,
    title: 'item 2',
    start_time: moment().add(-0.5, 'day'),
    end_time: moment().add(0.5, 'day')
  },
  {
    id: 3,
    group: 1,
    title: 'item 3',
    start_time: moment().add(2, 'day'),
    end_time: moment().add(3, 'day')
  }
]*/

/*const items = [];

const groupsMap = new Map();

for (const item of data) {
  if (!groupsMap.has(item.scope)) {
    groupsMap.set(item.scope, {
      id: groupsMap.size + 1,
      title: item.scope
    });
  }
  const date = moment(item['start-time']);
  const endDate = moment(item['start-time']).add(item.duration, 'hour');
  const bgColor = () => {
    switch (item['task-category']) {
      case 'task_card':
        return '#aa0000';
      case 'scheduled_wo':
        return '#00aa00';
      case 'maintenance_wo':
        return '#0000aa';
    }
  }
  items.push({
    id: item.id,
    group: groupsMap.get(item.scope).id,
    title: item.label,
    start_time: date,
    end_time: endDate,
    className: item['task-category'],
    itemProps: {
      style: {
        background: bgColor
      }
    }
  });
}

const groups = Array.from(groupsMap, ([key, values]) => values);
const startDate = moment(data[0]['start-time']).add(-12, 'hour');
const endDate = startDate.clone().add(7, 'day');*/


function App() {
  return (
    <div className="App">
      <PlanningTool />
      {/*<Timeline
        groups={groups}
        items={items}
        defaultTimeStart={startDate}
        defaultTimeEnd={endDate}
        stackItems
      />*/}
    </div>
  );
}

export default App;
