import React, {Component} from "react"
import moment from "moment"

import Timeline, {
  TodayMarker,
  CustomMarker,
} from "./timeline"
import './timeline/lib/Timeline.css'
import Xarrow from "react-xarrows"
import './../assets/PlanningTool.css'
import PropTypes from "prop-types"
import Popup from './Popup'

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

    this.actions = []
    this.redoActions = []

    let items = props.items || []
    let groups = props.groups || []

    if (!Array.isArray(items)) {
      items = []
    }
    if (!Array.isArray(groups)) {
      groups = []
    }

    for (const item of items) {
      item.parent = item.parent != null ? item.parent : null
      item.className = item.className != null ? item.className : 'item'
      item.bgColor = item.bgColor != null ? item.bgColor : '#2196F3'
      item.color = item.color != null ? item.color : '#fff'
      item.selectedBgColor = item.selectedBgColor != null ? item.selectedBgColor : '#FFC107'
      item.selectedColor = item.selectedColor != null ? item.selectedColor : '#000'
      item.draggingBgColor = item.draggingBgColor != null ? item.draggingBgColor : '#f00'
      item.highlightBgColor = item.highlightBgColor != null ? item.highlightBgColor : '#FFA500'
      item.highlight = item.highlight != null ? item.highlight : false
      item.canMove = item.canMove != null ? item.canMove : true
      item.canResize = item.canResize != null ? item.canResize : 'both'
      item.minimumDuration = item.minimumDuration != null ? item.minimumDuration : false
      item.maximumDuration = item.maximumDuration != null ? item.maximumDuration : false
    }

    groups = groups.sort((a, b) => a.level - b.level).reduce((accumulator, currentValue) => {
      let item = accumulator.find(x => x.id === currentValue.parent)
      let index = accumulator.indexOf(item)
      const count = accumulator.filter(x => x.parent === currentValue.parent).length
      index = index !== -1 ? index + count + 1 : accumulator.length
      accumulator.splice(index, 0, currentValue)
      return accumulator
    }, [])

    const defaultTimeStart = items.length > 0 ? moment(items[0].start).add(-12, 'hour') : moment()
    const defaultTimeEnd = defaultTimeStart.clone().add(7, 'day')

    const sidebarWidth = 250
    const sidebarResizing = false
    const popup = {
      open: false,
      item: null,
      custom: props.popup != null ? props.popup : false,
    }

    let milestones = []
    if (props.milestones) {
      milestones = props.milestones
    }

    this.timeline = React.createRef()

    this.state = {
      groups,
      items,
      defaultTimeStart,
      defaultTimeEnd,
      sidebarWidth,
      sidebarResizing,
      popup,
      milestones,
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
        className: 'item',
        bgColor: this.getTaskBackground(item),
        color: '#fff',
        selectedBgColor: '#FFC107',
        selectedColor: '#000',
        draggingBgColor: '#f00',
        highlightBgColor: '#FFA500',
        highlight: false,
        canMove: (level > 1 && level !== 3),
        canResize: "both", //'left','right','both', false
        minimumDuration: false,
      })

      if (item.planParts && item.planParts.length > 0) {
        this.buildData(item.planParts, groupsMap, items, level + 1, groupsMap.get(resourceId).id, itemId)
      }
    }
  }

  handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const {items, groups} = this.state

    const group = groups.filter(g => g.show)[newGroupOrder]

    this.addUndoItem(items.find(i => i.id === itemId))

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

    const item = items.find(item => item.id === itemId)

    this.addUndoItem(item)

    let start = moment(edge === "left" ? time : item.start)
    let end = moment(edge === "left" ? item.end : time)

    if (this.isLessThanMinimumDuration(item, start, end)) {
      if (edge === 'left') {
        start = end.clone().subtract(item.minimumDuration, 'minute')
      } else {
        end = start.clone().add(item.minimumDuration, 'minute')
      }
    } else if (this.isMoreThanMaximumDuration(item, start, end)) {
      if (edge === 'left') {
        start = end.clone().subtract(item.maximumDuration, 'minute')
      } else {
        end = start.clone().add(item.maximumDuration, 'minute')
      }
    }

    item.start = start
    item.end = end

    this.setState({
      items: items,
      draggedItem: undefined
    })
  }

  handleItemDrag = ({eventType, itemId, time, edge, newGroupOrder}) => {
    let item = this.state.draggedItem ? this.state.draggedItem.item : undefined
    if (!item) {
      item = this.state.items.find(i => i.id === itemId)
    }

    if (eventType === 'resize') {
      let start = item.start
      let end = item.end
      if (edge === 'left') {
        start = moment(time)
      } else {
        end = moment(time)
      }

      if (this.isLessThanMinimumDuration(item, start, end)) {
        if (edge === 'left') {
          time = end.clone().subtract(item.minimumDuration, 'minute')
        } else {
          time = start.clone().add(item.minimumDuration, 'minute')
        }
      }
    }

    const group = this.state.groups.filter(g => g.show)[newGroupOrder]
    this.setState({
      draggedItem: {item: item, group: group, time}
    })

    this.showItemInfo(item, group, {
      type: eventType,
      side: edge,
      time: time,
    })
  }

  isLessThanMinimumDuration = (item, start, end) => {
    if (!item.minimumDuration) {
      return false
    }

    return moment.duration(end.diff(start)).asMinutes() < item.minimumDuration
  }

  isMoreThanMaximumDuration = (item, start, end) => {
    if (!item.maximumDuration) {
      return false
    }

    return moment.duration(end.diff(start)).asMinutes() > item.maximumDuration
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

  highlightChildren = (item) => {
    const items = this.state.items.filter(i => i.parent === item.id)
    for (const item of items) {
      item.highlight = true
      this.highlightChildren(item)
    }
  }

  removeHighlight = () => {
    const items = this.state.items.filter(item => item.highlight)
    for (const item of items) {
      item.highlight = false
    }
  }

  itemDeselected = () => {
    this.removeHighlight()

    this.setState({
      items: this.state.items,
      popup: {
        open: false,
      }
    })
  }

  showItemInfo = (item, group, time) => {
    if (!item) {
      return
    }

    let start = item.start
    let end = item.end

    if (time) {
      if (time.type === 'resize') {
        if (time.side === 'left') {
          start = time.time
        } else {
          end = time.time
        }
      } else if (time.type === 'move') {
        end = time.time + (item.end - item.start)
        start = time.time
      }
    }

    this.setState({
      popup: {
        open: true,
        item: {
          ...item,
          start: start,
          end: end,
        },
        group: group != null ? group : this.state.groups.find(i => i.id === item.group),
        custom: this.state.popup.custom,
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

  addUndoItem = (item) => {
    this.redoActions = []
    this.actions.push(Object.assign({}, item))
  }

  undo = () => {
    if (this.actions.length <= 0) {
      return
    }
    const {items} = this.state

    const undoItem = this.actions.pop()
    this.redoActions.push(items.find(i => i.id === undoItem.id))

    this.setState({
      items: items.map(item =>
        item.id === undoItem.id
          ? Object.assign({}, undoItem)
          : item
      ),
      draggedItem: undefined
    })
  }

  redo = () => {
    if (this.redoActions.length <= 0) {
      return
    }
    const {items} = this.state

    const redoItem = this.redoActions.pop()
    this.actions.push(items.find(i => i.id === redoItem.id))

    this.setState({
      items: items.map(item =>
        item.id === redoItem.id
          ? Object.assign({}, redoItem)
          : item
      ),
      draggedItem: undefined
    })
  }

  onTimeChange(visibleTimeStart, visibleTimeEnd, updateScrollCanvas, unit) {
    updateScrollCanvas(visibleTimeStart, visibleTimeEnd)
  }

  focusItems = (items) => {
    if (!items || !Array.isArray(items) || items.length <= 0) {
      return
    }

    this.removeHighlight()
    let dateStart = items[0].start.clone()
    let dateEnd = items[0].end.clone()
    items[0].highlight = true
    items.shift()

    for (const item of items) {
      if (dateStart.diff(item.start) > 0) {
        dateStart = item.start.clone()
      }

      if (dateEnd.diff(item.end) < 0) {
        dateEnd = item.end.clone()
      }
      item.highlight = true
    }

    dateStart.subtract(1, 'hour')
    dateEnd.add(2, 'hour')
    this.timeline.current.updateScrollCanvas(dateStart.valueOf(), dateEnd.valueOf())
  }

  itemRenderer = ({item, timelineContext, itemContext, getItemProps, getResizeProps}) => {
    const {left: leftResizeProps, right: rightResizeProps} = getResizeProps()
    let backgroundColor = item.bgColor
    let color = item.color

    if (itemContext.selected) {
      color = item.selectedColor
      if (itemContext.dragging) {
        backgroundColor = item.draggingBgColor
      } else {
        backgroundColor = item.selectedBgColor
      }
    } else if (item.highlight) {
      backgroundColor = item.highlightBgColor
    }

    if (itemContext.dimensions.width < 20) {
      itemContext.dimensions.width = 20
    }

    return (
      <div
        {...getItemProps({
          style: {
            background: backgroundColor,
            color: color,
            minWidth: 20,
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
        className={item.canMove ? 'movable-item' : 'static-item'}
      >
        {itemContext.selected && (item.canResize === 'both' || item.canResize === 'left') ?
          itemContext.useResizeHandle ? <div {...leftResizeProps}/> : <span style={{
            cursor: 'ew-resize',
            width: 3,
            zIndex: 1000,
            position: 'absolute',
            top: 0,
            left: -3,
            height: '100%'
          }}/> : ''}

        <div
          style={{
            height: itemContext.dimensions.height,
            overflow: "hidden",
            paddingLeft: 3,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            zIndex: '100',
            position: 'relative',
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

        {itemContext.selected && (item.canResize === 'both' || item.canResize === 'right') ?
          itemContext.useResizeHandle ? <div {...rightResizeProps}/> : <span style={{
            cursor: 'ew-resize',
            width: 3,
            zIndex: 1000,
            position: 'absolute',
            top: 0,
            right: -3,
            height: '100%',
          }}/> : ''}
      </div>
    )
  }

  render() {
    const {groups, items, defaultTimeStart, defaultTimeEnd, sidebarWidth, popup, milestones} = this.state

    const newGroups = groups.filter((g) => g.show).map((group) => {
      return Object.assign({}, group, {
        title: group.hasChildren ? (
          <div onClick={() => this.toggleGroup(group.id)}
               style={{
                 cursor: 'pointer',
                 paddingLeft: group.level * 20
               }}>
            {group.open ? '[-]' : '[+]'} {group.title}
          </div>
        ) : (
          <div style={{paddingLeft: group.level * 20}}>
            {group.title}
          </div>
        )
      })
    })

    return (
      <div>
        <Timeline
          ref={this.timeline}
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
          onTimeChange={this.onTimeChange}
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
          {milestones.length > 0 ?
            milestones.map((milestone, i) =>
              <CustomMarker date={milestone.date.valueOf()} key={'marker-' + i}>
                {({styles, date}) => {
                  const customStyles = {
                    ...styles,
                    backgroundColor: milestone.color ? milestone.color : '#000',
                    width: '3px',
                    pointerEvents: 'auto',
                    zIndex: 1000,
                  }

                  return <div
                    style={customStyles}
                    className={'milestone'}
                  >
                    <span className="milestone-label">
                      {milestone.label ? milestone.label : ''}<br/>
                      <span className="milestone-date">{milestone.date.format('LLL')}</span>
                    </span>
                  </div>
                }}
              </CustomMarker>
            )
            :
            ''
          }
        </Timeline>

        <div className="action-buttons">
          <button className={`action-button ${this.actions.length <= 0 ? 'disabled' : ''}`} onClick={this.undo}>
            Undo
          </button>
          <button className={`action-button ${this.redoActions.length <= 0 ? 'disabled' : ''}`} onClick={this.redo}>
            Redo
          </button>
        </div>


        {/*<div onClick={() => this.focusItems(items.filter(item => (item.id === 8 || item.id === 10)))}>
          focus
        </div>*/}

        {popup.open && (
          popup.custom ?
            popup.custom({
              item: popup.item,
              group: popup.group,
            })
            :
            <Popup
              item={popup.item}
              group={popup.group}
            />
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


PlanningTool.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      group: PropTypes.number.isRequired,
      title: PropTypes.string,
      start: PropTypes.instanceOf(moment).isRequired,
      end: PropTypes.instanceOf(moment).isRequired,
      parent: PropTypes.number,
      className: PropTypes.string,
      bgColor: PropTypes.string,
      color: PropTypes.string,
      selectedBgColor: PropTypes.string,
      selectedColor: PropTypes.string,
      draggingBgColor: PropTypes.string,
      highlightBgColor: PropTypes.string,
      highlight: PropTypes.bool,
      canMove: PropTypes.bool,
      canResize: PropTypes.oneOf(['both', 'left', 'right', false]),
      minimumDuration: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([false])]),
      maximumDuration: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([false])]),
    }
  )).isRequired,
  groups: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    hasChildren: PropTypes.bool,
    parent: PropTypes.number,
    open: PropTypes.bool.isRequired,
    show: PropTypes.bool.isRequired,
    level: PropTypes.number.isRequired,
  })).isRequired,
  popup: PropTypes.elementType,
  milestones: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.instanceOf(moment).isRequired,
    label: PropTypes.string,
    color: PropTypes.string,
  }))
}

PlanningTool.defaultProps = {
  items: [
    {
      parent: null,
      className: 'item',
      bgColor: '#2196F3',
      color: '#fff',
      selectedBgColor: '#FFC107',
      selectedColor: '#000',
      draggingBgColor: '#f00',
      highlightBgColor: '#FFA500',
      highlight: false,
      canMove: true,
      canResize: 'both',
      minimumDuration: false,
      maximumDuration: false,
    }
  ],
  groups: [],
  popup: Popup,
}
export default PlanningTool