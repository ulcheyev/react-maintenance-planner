import React, {Component} from "react"
import moment from "moment"

import Timeline, {
  TodayMarker
} from "./timeline"
import InfoLabel from "./InfoLabel"
import './timeline/lib/Timeline.css'
import Xarrow from "react-xarrows"
import './../assets/PlanningTool.css'
import PropTypes from "prop-types";


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
}

class PlanningTool extends Component {

  constructor(props) {
    super(props)

    const data = props.data
    const items = []
    const groupsMap = new Map()
    this.buildData(data, groupsMap, items, 0, null)

    let groups = Array.from(groupsMap, ([key, values]) => values)

    groups = groups.sort((a, b) => a.level - b.level).reduce((accumulator, currentValue) => {
      let item = accumulator.find(x => x.id === currentValue.parent)
      let index = accumulator.indexOf(item)
      const count = accumulator.filter(x => x.parent === currentValue.parent).length
      index = index !== -1 ? index + count + 1 : accumulator.length
      accumulator.splice(index, 0, currentValue)
      return accumulator
    }, [])

    if (items.length > 0) {
      items.find(i => i.id === 4).dependency = 3
      items.find(i => i.id === 5).dependency = 3
    }
    const defaultTimeStart = items.length > 0 ? moment(items[0].start).add(-12, 'hour') : moment()
    const defaultTimeEnd = defaultTimeStart.clone().add(7, 'day')

    const sidebarWidth = 250
    const sidebarResizing = false
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
      sidebarResizing,
      popup,
      props
    }
  }

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
    if (!data || !Array.isArray(data)) {
      return
    }

    for (const item of data) {
      const resourceId = item.resource.id + " - " + item.resource.type
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
        })
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
      })

      if (item.planParts && item.planParts.length > 0) {
        this.buildData(item.planParts, groupsMap, items, level + 1, groupsMap.get(resourceId).id, itemId)
      }
    }
  }

  handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const {items, groups} = this.state

    const group = groups.filter(g => g.show)[newGroupOrder]

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
    })
  }

  handleItemResize = (itemId, time, edge) => {
    const {items} = this.state

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
    })
  }

  closeChildren = (groups, id) => {
    groups.filter(g => g.parent === id).forEach((g) => {
      g.show = false

      if (g.hasChildren) {
        g.open = false
        groups = this.closeChildren(groups, g.id)
      }
    })

    return groups
  }

  toggleGroup = (id) => {
    let {groups} = this.state

    const group = groups.find(g => g.id === id)
    group.open = !group.open

    groups.filter(g => g.parent === id).forEach((g) => {
      g.show = group.open

      if (!group.open) {
        g.open = false
        groups = this.closeChildren(groups, g.id)
      }
    })

    this.setState({
      groups: groups
    })
  }

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
    const {left: leftResizeProps, right: rightResizeProps} = getResizeProps()
    let backgroundColor = itemContext.selected ? (itemContext.dragging ? "red" : item.selectedBgColor) : item.bgColor
    if (item.highlight) {
      backgroundColor = '#FFA500'
    }
    //const borderColor = itemContext.resizing ? "red" : '#000'//item.color
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
    )
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
    let item = this.state.draggedItem ? this.state.draggedItem.item : undefined
    if (!item) {
      item = this.state.items.find(i => i.id === itemId)
    }
    this.setState({
      draggedItem: {item: item, group: this.state.groups.filter(g => g.show)[newGroupOrder], time}
    })
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

  onSidebarDown = (e) => {
    if (e.button !== 0) {
      return
    }
    e.stopPropagation()
    e.preventDefault()
    this.setState({
      sidebarWidth: e.clientX - document.querySelector('.rct-sidebar').getBoundingClientRect().left,
      sidebarResizing: true,
    })
  }

  onSidebarMove = (e) => {
    console.log(e.target)
    e.stopPropagation()
    e.preventDefault()
    if (!this.state.sidebarResizing) {
      return
    }

    const width = e.clientX - document.querySelector('.rct-sidebar').getBoundingClientRect().left
    if (width < 10) {
      return
    }
    this.setState({
      sidebarWidth: width,
    })
  }

  onSidebarUp = (e) => {
    e.stopPropagation()
    e.preventDefault()
    this.setState({
      sidebarResizing: false,
    })
  }

  render() {
    const {groups, items, defaultTimeStart, defaultTimeEnd, sidebarWidth, popup, draggedItem} = this.state

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
          handleSidebarResize={{
            down: this.onSidebarDown,
            move: this.onSidebarMove,
            up: this.onSidebarUp,
            resizing: this.state.sidebarResizing,
          }}
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
                  To: {popup.item.end.format('LLL')}
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
}

PlanningTool.defaultProps = {
  data: require('./../data3.json')
}
PlanningTool.propTypes = {
  data: PropTypes.array,
}
export default PlanningTool