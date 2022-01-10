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

  buildData = (data, groupsMap, items, level, parentId) => {
    for (const item of data) {
      if (!groupsMap.has(item.resource.id)) {
        groupsMap.set(item.resource.id, {
          id: groupsMap.size,
          title: item.resource ? item.resource.title : '',
          rightTitle: 'right title',
          hasChildren: item.planParts && item.planParts.length > 0,
          parent: parentId,
          open: level < 1,
          show: level < 2,
          level: level,
        });
      }

      const date = moment(item["planned-start-time"]);
      const endDate = moment(item["planned-end-time"]);
      items.push({
        id: items.length + 1,
        group: groupsMap.get(item.resource.id).id,
        title: item.title,
        start: date,
        end: endDate,
        className: 'className',
      })

      if (item.planParts && item.planParts.length > 0) {
        this.buildData(item.planParts, groupsMap, items, level + 1, groupsMap.get(item.resource.id).id);
      }
    }
  }

  constructor(props) {
    super(props);

    const data = require('./../data.json');

    const items = [];
    const groupsMap = new Map();
    this.buildData(data, groupsMap, items, 0, null);

    /*let items = [];

    let groupsMap = new Map();

    const item = data
    groupsMap.set(item.id, {
      id: item.id,
      title: item.resource ? item.resource.title : '',
      rightTitle: 'right title',
      hasChildren: item.planParts.length > 0,
      parent: null,
      open: true,
      show: true,
      level: 0
    });

    const date = moment(item["planned-start-time"]);
    const endDate = moment(item["planned-end-time"]);
    items.push({
      id: items.length + 1,
      group: groupsMap.get(item.id).id,
      title: item.title,
      start: date,
      end: endDate,
      className: 'className',
    });*/

    /*for (const item2 of data.planParts) {
      groupsMap.set(item2.id, {
        id: item2.id,
        title: item2.resource ? item2.resource.title : '',
        rightTitle: 'right title',
        hasChildren: item2.planParts.length > 0,
        parent: item.id,
        open: false,
        show: true,
        level: 1
      });

      const date = moment(item2["planned-start-time"]);
      const endDate = moment(item2["planned-end-time"]);
      items.push({
        id: items.length + 1,
        group: groupsMap.get(item2.id).id,
        title: item2.title,
        start: date,
        end: endDate,
        className: 'className',
      });

      if (item2.planParts.length > 0) {
        for (const item3 of item2.planParts) {
          groupsMap.set(item3.id, {
            id: item3.id,
            title: item3.resource ? item3.resource.title : '',
            rightTitle: 'right title',
            hasChildren: item3.planParts.length > 0,
            parent: item2.id,
            open: false,
            show: false,
            level: 2
          });

          const date = moment(item3["planned-start-time"]);
          const endDate = moment(item3["planned-end-time"]);
          items.push({
            id: items.length + 1,
            group: groupsMap.get(item3.id).id,
            title: item3.title,
            start: date,
            end: endDate,
            className: 'className',
          });

          if (item3.planParts.length > 0) {
            for (const item4 of item3.planParts) {
              groupsMap.set(item4.id, {
                id: item4.id,
                title: item4.resource ? item4.resource.title : '',
                rightTitle: 'right title',
                hasChildren: item4.planParts.length > 0,
                parent: item3.id,
                open: false,
                show: false,
                level: 3
              });

              const date = moment(item4["planned-start-time"]);
              const endDate = moment(item4["planned-end-time"]);
              items.push({
                id: items.length + 1,
                group: groupsMap.get(item4.id).id,
                title: item4.title,
                start: date,
                end: endDate,
                className: 'className',
              });


              if (item4.planParts.length > 0) {
                for (const item5 of item4.planParts) {
                  groupsMap.set(item5.id, {
                    id: item5.id,
                    title: item5.resource ? item5.resource.title : '',
                    rightTitle: 'right title',
                    hasChildren: false,
                    parent: item4.id,
                    open: false,
                    show: false,
                    level: 4
                  });

                  const date = moment(item5["start-time"]);
                  const endDate = moment(item5["end-time"]);
                  items.push({
                    id: items.length + 1,
                    group: groupsMap.get(item5.id).id,
                    title: item5.title,
                    start: date,
                    end: endDate,
                    className: 'className',
                  });
                }
              }
            }
          }
        }
      }
    }*/

    /*for (const item of data) {
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
           /!* case 'task_card':
              return '#aa0000';
            case 'scheduled_wo':
              return '#00aa00';
            case 'maintenance_wo':
              return '#0000aa';*!/
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
    }*/


    let groups = Array.from(groupsMap, ([key, values]) => values);

    groups = groups.reduce((accumulator, currentValue) => {
      let item = accumulator.find(x => x.id === currentValue.parent);
      let index = accumulator.indexOf(item);
      index = index !== -1 ? index + 1 : accumulator.length;
      accumulator.splice(index, 0, currentValue);
      return accumulator;
    }, []);

    const defaultTimeStart = moment(items[0].start).add(-12, 'hour');
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

    const group = groups.filter(g => g.show)[newGroupOrder];

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

    // console.log("Moved", itemId, dragTime, newGroupOrder);
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
               style={{cursor: 'pointer', paddingLeft: group.level * 20}}>
            {group.open ? '[-]' : '[+]'} {group.title}
          </div>
        ) : (
          <div style={{paddingLeft: group.level * 20}}>{group.title}</div>
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
          sidebarWidth={250}
          defaultTimeStart={defaultTimeStart}
          defaultTimeEnd={defaultTimeEnd}
          onItemMove={this.handleItemMove}
          onItemResize={this.handleItemResize}
        />
      </div>
    );
  }
}
