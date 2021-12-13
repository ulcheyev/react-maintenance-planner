import React, {Component} from "react";
import moment from "moment";

import Timeline from "react-calendar-timeline";
import 'react-calendar-timeline/lib/Timeline.css';

const keys = {
  groupIdKey: "id",
  groupTitleKey: "title",
  groupRightTitleKey: "rightTitle",
  itemIdKey: "id",
  itemTitleKey: "title",
  itemDivTitleKey: "title",
  itemGroupKey: "group",
  itemTimeStartKey: "start",
  itemTimeEndKey: "end",
  groupLabelKey: "title"
};

export default class PlanningTool extends Component {
  constructor(props) {
    super(props);

    const data = require('./../data.json');
    const items = [];

    const groupsMap = new Map();

    for (const item of data) {
      const groupColor = Math.floor(Math.random() * 16777215).toString(16);

      let hasParent = false
      item['resource-type-path'].forEach((resource, i) => {
        if (!groupsMap.has(resource.label)) {
          const parent = hasParent ? groupsMap.get(item['resource-type-path'][i - 1].label) : null;
          const hasChildren = i + 1 < item['resource-type-path'].length;

          groupsMap.set(resource.label, {
            id: groupsMap.size + 1,
            title: resource.label,
            rightTitle: 'right title',
            hasChildren: hasChildren,
            parent: hasParent ? parent.id : null,
            open: false,
            show: !hasParent
          });
        }
        hasParent = true;
      });

      item['event-type-path'].forEach((event, i) => {
        const date = moment(item['planned-start-time']);
        const endDate = moment(item['planned-start-time']).add(item['planned-duration'], 'hour');
        const bgColor = () => {
          switch (event['task-category']) {
           /* case 'task_card':
              return '#aa0000';
            case 'scheduled_wo':
              return '#00aa00';
            case 'maintenance_wo':
              return '#0000aa';*/
            default:
              return '#' + groupColor;
          }
        }

        items.push({
          id: items.length + 1,
          group: groupsMap.get(item['resource-type-path'][i]['label']).id,
          title: event['label'],
          start: date,
          end: endDate,
          className: event['task-category'],
          itemProps: {
            style: {
              background: bgColor()
            }
          }
        });
      });
    }

    const groups = Array.from(groupsMap, ([key, values]) => values);
    const defaultTimeStart = moment(data[0]['planned-start-time']).add(-12, 'hour');
    const defaultTimeEnd = defaultTimeStart.clone().add(7, 'day');

    this.state = {
      groups,
      items,
      defaultTimeStart,
      defaultTimeEnd,
    };
  }

  handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const {items, groups} = this.state;

    const group = groups[newGroupOrder];

    this.setState({
      items: items.map(item =>
        item.id === itemId
          ? Object.assign({}, item, {
            start: dragTime,
            end: dragTime + (item.end - item.start),
            group: group.id
          })
          : item
      )
    });

    console.log("Moved", itemId, dragTime, newGroupOrder);
  };

  handleItemResize = (itemId, time, edge) => {
    const {items} = this.state;

    this.setState({
      items: items.map(item =>
        item.id === itemId
          ? Object.assign({}, item, {
            start: edge === "left" ? time : item.start,
            end: edge === "left" ? item.end : time
          })
          : item
      )
    });

    console.log("Resized", itemId, time, edge);
  };

  closeChildren = (groups, id) => {
    groups.filter(g => g.parent === id).forEach((g) => {
      g.show = false;

      if (g.hasChildren) {
        g.open = false;
        groups = this.closeChildren(groups, g.id);
      }
    });

    return groups;
  };

  toggleGroup = (id) => {
    let {groups} = this.state;

    const group = groups.find(g => g.id === id);
    group.open = !group.open;

    groups.filter(g => g.parent === id).forEach((g) => {
      g.show = group.open;

      if (!group.open) {
        g.open = false;
        groups = this.closeChildren(groups, g.id);
      }
    });

    this.setState({
      groups: groups
    });
  };

  render() {
    const {groups, items, defaultTimeStart, defaultTimeEnd} = this.state;

    const newGroups = groups.filter((g) => g.show).map((group) => {
      return Object.assign({}, group, {
        title: group.hasChildren ? (
          <div onClick={() => this.toggleGroup(group.id)}
               style={{cursor: 'pointer', paddingLeft: group.parent !== null ? 20 : 0}}>
            {group.open ? '[-]' : '[+]'} {group.title}
          </div>
        ) : (
          <div style={{paddingLeft: 40}}>{group.title}</div>
        )
      })
    });

    return (
      <div>
        <Timeline
          groups={newGroups}
          items={items}
          keys={keys}
          fullUpdate
          itemTouchSendsClick={false}
          stackItems
          itemHeightRatio={0.75}
          canMove={true}
          canResize={"both"}
          defaultTimeStart={defaultTimeStart}
          defaultTimeEnd={defaultTimeEnd}
          onItemMove={this.handleItemMove}
          onItemResize={this.handleItemResize}
        />
      </div>
    );
  }
}
