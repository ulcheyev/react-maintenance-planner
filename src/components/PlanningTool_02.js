import React, { Component } from "react";
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

export default class PlanningTool_02 extends Component {
  constructor(props) {
    super(props);

    const data = require('./../test.json');
    const items = [];

    const groupsMap = new Map();

    for (const item of data) {
      if (!groupsMap.has(item.scope)) {
        groupsMap.set(item.scope, {
          id: groupsMap.size + 1,
          title: item.scope,
          rightTitle: 'right title'
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
          default:
            return '#000';
        }
      }
      items.push({
        id: item.id,
        group: groupsMap.get(item.scope).id,
        title: item.label,
        start: date,
        end: endDate,
        className: item['task-category'],
        itemProps: {
          style: {
            background: bgColor
          }
        }
      });
    }

    const groups = Array.from(groupsMap, ([key, values]) => values);
    const defaultTimeStart = moment(data[0]['start-time']).add(-12, 'hour');
    const defaultTimeEnd = defaultTimeStart.clone().add(7, 'day');

   /* const defaultTimeStart = moment()
      .startOf("day")
      .toDate();
    const defaultTimeEnd = moment()
      .startOf("day")
      .add(1, "day")
      .toDate();*/

    this.state = {
      groups,
      items,
      defaultTimeStart,
      defaultTimeEnd
    };
  }

  handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const { items, groups } = this.state;

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
    const { items } = this.state;

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

  render() {
    const { groups, items, defaultTimeStart, defaultTimeEnd } = this.state;

    return (
      <Timeline
        groups={groups}
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
    );
  }
}
