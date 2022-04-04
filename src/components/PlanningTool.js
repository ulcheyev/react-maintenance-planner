import React, {Component} from "react";
import moment from "moment";

import Timeline, {
  TodayMarker
} from "react-calendar-timeline";
import InfoLabel from "./InfoLabel";
import 'react-calendar-timeline/lib/Timeline.css';
import Xarrow from "react-xarrows";
import ReactDOM from "react-dom";

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

  /*buildData = (data, groupsMap, items, level, parentId) => {
    for (const item of data) {
      const resourceId = groupsMap.size;
      if (!groupsMap.has(resourceId)) {
        groupsMap.set(resourceId, {
          id: groupsMap.size,
          title: item.resource ? item.resource.title : '',
          rightTitle: 'right title',
          hasChildren: item.planParts && item.planParts.length > 0,
          parent: parentId,
          open: level < 0,
          show: level < 1,
          level: level,
        });
      }

      const date = moment(item.type === 'SessionPlan' ? item["start-time"] :item["planned-start-time"])
      const endDate = moment(item.type === 'SessionPlan' ? item["end-time"] :item["planned-end-time"])
      items.push({
        id: items.length + 1,
        group: groupsMap.get(resourceId).id,
        title: item.title,
        start: date,
        end: endDate,
        className: 'className',
      })

      if (item.planParts && item.planParts.length > 0) {
        this.buildData(item.planParts, groupsMap, items, level + 1, groupsMap.get(resourceId).id);
      }
    }
  }*/

  getTaskBackground = (task) => {
    if (!task['task-type']) {
      return '#2196F3'
    }
    switch (task['task-type']['task-category']) {
      case 'scheduled_wo':
        return '#aa0000'
      case 'task_card':
        return '#00aa00'
      case 'maintenance_wo':
        return '#0000aa'
      default:
        return '#2196F3'
    }
  }

  buildData = (data, groupsMap, items, level, groupParentId, itemParentId) => {
    for (const item of data) {
      const resourceId = item.resource.id + " - " + item.resource.type;
      if (!groupsMap.has(resourceId)) {
        groupsMap.set(resourceId, {
          id: groupsMap.size,
          title: item.resource ? item.resource.title : '',
          rightTitle: 'right title',
          hasChildren: item.planParts && item.planParts.length > 0,
          parent: groupParentId,
          open: level < 1,
          show: level < 2,
          level: level,
        });
      }

      const date = moment(item.type === 'SessionPlan' ? item["start-time"] : item["planned-start-time"]).add('1', 'year').add('2', 'month').add('27', 'day')
      const endDate = moment(item.type === 'SessionPlan' ? item["end-time"] : item["planned-end-time"]).add('1', 'year').add('2', 'month').add('27', 'day')
      const itemId = items.length + 1

      items.push({
        id: itemId,
        group: groupsMap.get(resourceId).id,
        title: item.title,
        start: date,
        end: endDate,
        parent: itemParentId,
        className: 'className',
        bgColor: this.getTaskBackground(item),
        color: '#fff',
        selectedBgColor: '#FFC107',
        highlight: false
      });

      if (item.planParts && item.planParts.length > 0) {
        this.buildData(item.planParts, groupsMap, items, level + 1, groupsMap.get(resourceId).id, itemId)
      }
    }
  }

  constructor(props) {
    super(props);

    const data = require('./../data3.json');

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

    groups = groups.sort((a, b) => a.level - b.level).reduce((accumulator, currentValue) => {
      let item = accumulator.find(x => x.id === currentValue.parent);
      let index = accumulator.indexOf(item);
      const count = accumulator.filter(x => x.parent === currentValue.parent).length;
      index = index !== -1 ? index + count + 1 : accumulator.length;
      accumulator.splice(index, 0, currentValue);
      return accumulator;
    }, []);

    /*    for(const g of groups){
          console.log(g.title, items.filter(i => i.group === g.id))
        }*/

    items.find(i => i.id === 4).dependency = 3;
    items.find(i => i.id === 5).dependency = 3;
    const defaultTimeStart = moment(items[0].start).add(-12, 'hour');
    const defaultTimeEnd = defaultTimeStart.clone().add(7, 'day');

    const sidebarWidth = 250;
    const popup = {
      open: false,
      item: null,
    }

    this.state = {
      groups,
      items,
      defaultTimeStart,
      defaultTimeEnd,
      sidebarWidth,
      popup
    };
  }

  handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const {items, groups} = this.state;

    const group = groups.filter(g => g.show)[newGroupOrder];

    this.setState({
      items: items.map(item =>
        item.id === itemId
          ? Object.assign({}, item, {
            start: moment(dragTime),
            end: moment(dragTime + (item.end - item.start)),
            group: group.id
          })
          : item
      ),
      draggedItem: undefined
    });

    // console.log("Moved", itemId, dragTime, newGroupOrder);
  };

  handleItemResize = (itemId, time, edge) => {
    const {items} = this.state;

    this.setState({
      items: items.map(item =>
        item.id === itemId
          ? Object.assign({}, item, {
            start: moment(edge === "left" ? time : item.start),
            end: moment(edge === "left" ? item.end : time)
          })
          : item
      ),
      draggedItem: undefined
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

  highlightChildren = (item) => {
    const items = this.state.items.filter(i => i.parent === item.id)
    for (const item of items) {
      item.highlight = true
      this.highlightChildren(item)
    }

    /*const childrenGroups = this.state.groups.filter(group => group.parent === item.group)
    for (const group of childrenGroups) {
      const items = this.state.items
      for (const item of items.filter(item => item.group === group.id)) {
        item.highlight = true
        this.state.highlightedItems.push(item)
        this.highlightChildren(item)
      }
    }*/
  }

  removeHighlight = () => {
    const items = this.state.items.filter(item => item.highlight)
    for (const item of items) {
      item.highlight = false
    }
  }

  itemRenderer = ({item, timelineContext, itemContext, getItemProps, getResizeProps}) => {
    const {left: leftResizeProps, right: rightResizeProps} = getResizeProps();
    let backgroundColor = itemContext.selected ? (itemContext.dragging ? "red" : item.selectedBgColor) : item.bgColor;
    if (item.highlight) {
      backgroundColor = '#FFA500';
    }
    //const borderColor = itemContext.resizing ? "red" : '#000';//item.color;
    return (
      <div
        {...getItemProps({
          style: {
            background: backgroundColor,
            color: item.color,
            /*borderColor: borderColor,
            borderStyle: "solid",
            borderRadius: 0,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderLeftWidth: itemContext.selected ? 3 : 1,
            borderRightWidth: itemContext.selected ? 3 : 1*/
          },
          onMouseDown: () => {
            item.selected = true
            this.removeHighlight()
            this.highlightChildren(item)
            this.showItemInfo(this.state.items.find(i => i.id === item.id))
            this.setState({
              items: this.state.items
            })
          },

        })}
        id={'item-' + item.id}
      >
        {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : null}

        <div
          style={{
            height: itemContext.dimensions.height,
            overflow: "hidden",
            paddingLeft: 3,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {itemContext.title}
        </div>

        {item.dependency ?
          <Xarrow
            start={'item-' + item.dependency}
            end={'item-' + item.id}
            strokeWidth={2}
            headSize={6}
          />
          :
          ''
        }

        {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : null}
      </div>
    );
  }

  itemDeselected = (item) => {
    this.removeHighlight()

    this.setState({
      items: this.state.items,
      popup: {
        open: false,
      }
    })
  }

  handleItemDrag = ({eventType, itemId, time, edge, newGroupOrder}) => {
    let item = this.state.draggedItem ? this.state.draggedItem.item : undefined;
    if (!item) {
      item = this.state.items.find(i => i.id === itemId);
    }
    this.setState({
      draggedItem: {item: item, group: this.state.groups.filter(g => g.show)[newGroupOrder], time}
    });
  }

  showItemInfo = (item) => {
    if (!item) {
      return
    }
    this.setState({
      popup: {
        open: true,
        item: item,
      }
    })
  }

  resizeSidebar = () => {

  }

  render() {
    const {groups, items, defaultTimeStart, defaultTimeEnd, sidebarWidth, popup, draggedItem} = this.state;

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
    })

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
          sidebarWidth={sidebarWidth}
          defaultTimeStart={defaultTimeStart}
          defaultTimeEnd={defaultTimeEnd}
          itemRenderer={this.itemRenderer}
          onItemMove={this.handleItemMove}
          onItemResize={this.handleItemResize}
          onItemDeselect={this.itemDeselected}
          onItemDrag={this.handleItemDrag}
        >
          <TodayMarker interval={1000}/>
        </Timeline>

        {draggedItem && (
          <InfoLabel
            item={draggedItem.item}
            group={draggedItem.group}
            time={draggedItem.time}
          />
        )}

        {popup.open && (
          <div className="popup">
            <div className="popup-body">
              <h3>{popup.item.title}</h3>
              <div className="dates">
                <h4>Date</h4>
                <span className="date date-from">
                  From: {popup.item.start.format('LLL')}
                </span>
                <br/>
                <span className="date date-to">
                  To: {popup.item.end?.format('LLL')}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="explanatory-notes">
          <h3>Task types</h3>
          <div className="note">
            <span className="color scheduled-wo"/>
            Scheduled_wo
          </div>
          <div className="note">
            <span className="color task-card"/>
            Task_card
          </div>
          <div className="note">
            <span className="color maintenance-wo"/>
            Maintenance_wo
          </div>
        </div>
      </div>
    )
  }

  componentDidMount() {
    const sidebar = document.querySelector('.rct-sidebar')
    // ReactDOM.render(<div className={'xy'}></div>, sidebar)
  }
}
