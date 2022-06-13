import React, {Component} from "react"
import moment from "moment"
import { HiOutlinePencil } from "react-icons/hi";

import Timeline, {
  TodayMarker,
  CustomMarker
} from "./timeline/src"
import './timeline/src/lib/Timeline.css'
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

    //setting default values of items
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

    //sorting groups tree to order by parent
    groups = groups.sort((a, b) => a.level - b.level).reduce((accumulator, currentValue) => {
      let item = accumulator.find(x => x.id === currentValue.parent)
      let index = accumulator.indexOf(item)
      const count = accumulator.filter(x => x.parent === currentValue.parent).length
      index = index !== -1 ? index + count + 1 : accumulator.length
      accumulator.splice(index, 0, currentValue)
      return accumulator
    }, [])

    const defaultTimeStart = items.length > 0 ? moment(items[0].start).add(-12, 'hour') : moment()
    const defaultTimeEnd = items.length > 0 ? moment(items[0].end).add(12, 'hour') : moment()

    const sidebarWidth = 300
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

    const showIcons = false

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
      showIcons
    }
  }


  /**
   * Event handler when changing position of item
   */
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

  /**
   * Event handler when changing duration of item
   */
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

  /**
   * Event handler when dragging an item
   */
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

  /**
   * Event handler for opening and closing group children
   */
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

  /**
   * Closing group children
   */
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

  /**
   * Highlights children of an item
   */
  highlightChildren = (item) => {
    const items = this.state.items.filter(i => i.parent === item.id)
    for (const item of items) {
      item.highlight = true
      this.highlightChildren(item)
    }
  }

  /**
   * Turns off highlighting of every item
   */
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

  /**
   * Provides data into popup
   */
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

  /**
   * Mouse down event handler when changing width of sidebar
   */
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

  /**
   * Mouse move event handler when changing width of sidebar
   */
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

  /**
   * Mouse up event handler when changing width of sidebar
   */
  onSidebarUp = (e) => {
    e.stopPropagation()
    e.preventDefault()
    this.setState({
      sidebarResizing: false,
    })
  }

  /**
   * Adding item into list of returned changes
   */
  addUndoItem = (item) => {
    this.redoActions = []
    this.actions.push(Object.assign({}, item))
  }

  /**
   * Returns last change in component
   */
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

  /**
   * Restores last returned change
   */
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

  /**
   * Updates current time to be displayed in timeline
   */
  onTimeChange(visibleTimeStart, visibleTimeEnd, updateScrollCanvas, unit) {
    updateScrollCanvas(visibleTimeStart, visibleTimeEnd)
  }

  /**
   * Focuses group of items in timeline
   */
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

  renderPopup = (popup) => {
    return (
        <>
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
        </>
    )
  }

  /**
   * Custom item renderer
   */
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
          onMouseEnter={() => this.handleShowIconsOnMouseEnter(null, item.id)}
          onMouseLeave={() => this.handleShowIconsOnMouseLeave(null, item.id)}
          onKeyUp={(e) => this.handleInputFieldOnKeyUp(e, null, item.id)}
          {...getItemProps({
            style: {
              background: backgroundColor,
              color: color,
              minWidth: 20,
            },
            /**
             * Event handler when click on an item
             */
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
        {/*left resize*/}
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
          {item.isEditMode ? this.renderEditMode(item.id) : itemContext.title}
          {item.showIcons &&
          <span
              onClick={(e) => this.handleEditMode(e, null, item.id)}
              className="edit-icon"><HiOutlinePencil/>
          </span>
          }
        </div>

        {/*dependencies of en item*/}
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

        {/*right resize*/}
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

  handleShowIconsOnMouseEnter = (groupId, itemId) => {
    let {groups} = this.state;
    let {items} = this.state;

    if (groupId) {
      const group = groups.find(g => g.id === groupId)
      group.showIcons = true

      this.setState({
        groups: groups
      })
    }

    if (itemId) {
      const item = items.find(g => g.id === itemId)
      item.showIcons = true

      this.setState({
        items: items
      })
    }
  }

  handleShowIconsOnMouseLeave = (groupId, itemId) => {
    let {groups} = this.state;
    let {items} = this.state;

    if (groupId) {
      const group = groups.find(g => g.id === groupId)
      group.showIcons = false

      this.setState({
        groups: groups
      })
    }

    if (itemId) {
      const item = items.find(g => g.id === itemId)
      item.showIcons = false

      this.setState({
        items: items
      })
    }
  }

  handleEditMode = (e, groupId, itemId) => {
    e.stopPropagation();

    let {groups} = this.state;
    let {items} = this.state;

    if (groupId) {
      const group = groups.find(g => g.id === groupId)
      group.isEditMode = !group.isEditMode

      this.setState({
        groups: groups
      })
    }

    if (itemId) {
      const item = items.find(g => g.id === itemId)
      item.isEditMode = !item.isEditMode
      this.setState({
        items: items
      })
    }
  }

  handleInputFieldValue = (e, groupId, itemId) => {
    let {groups} = this.state
    let {items} = this.state

    if (groupId) {
      const group = groups.find(g => g.id === groupId)
      group.title = e.target.value
    }

    if (itemId) {
      console.log(itemId)
      const item = items.find(g => g.id === itemId)
      item.title = e.target.value
    }
  }

  handleInputFieldOnKeyUp = (e, groupId, itemId) => {
    console.log(itemId)
    if (e.key === 'Enter' && e.ctrlKey) {
      this.handleEditMode(e, groupId, itemId);
      this.handleInputFieldValue(e, groupId, itemId)
    }
    if (e.key === 'Escape') this.handleEditMode(e, groupId, itemId)
  }

  renderEditMode = () => {
    return (
        <input
            autoFocus
            onClick={e => e.stopPropagation()}
            placeholder="Ctrl+Enter / Escape" />
    )
  }

  renderGroup = (group) => {
    return (
        <div
            className="resource"
            onClick={() => this.toggleGroup(group.id)}
            style={{cursor: 'pointer'}}
        >
          {
            group.hasChildren ?
                group.isEditMode ?
                    group.open ? "[-] "
                        : "[+] "
                    : group.open ? `[-] ${group.title} `
                        : `[+] ${group.title} `
                : group.isEditMode ? ""
                    : group.title
          }

          {group.isEditMode && this.renderEditMode(group.id)}
          {group.showIcons &&
          <div
              onClick={(e) => this.handleEditMode(e, group.id)}
              className="edit-icon"><HiOutlinePencil/>
          </div>
          }
        </div>
    )
  }

  render() {
    const {groups, items, defaultTimeStart, defaultTimeEnd, sidebarWidth, popup, milestones} = this.state

    /**
     * Filters groups which should be displayed in timeline
     * and sets up event handler to toggle groups that have children
     */
    const newGroups = groups.filter((g) => g.show).map((group) => {
      return Object.assign({}, group, {
        title:
            <div
                onMouseEnter={() => this.handleShowIconsOnMouseEnter(group.id)}
                onMouseLeave={() => this.handleShowIconsOnMouseLeave(group.id)}
                onKeyUp={(e) => this.handleInputFieldOnKeyUp(e, group.id)}
                style={{paddingLeft: group.level * 20}}

            >
              {this.renderGroup(group)}
            </div>
      })
    })

    return (
      <>
        <div className="timeline-container">
          <Timeline className="timeline"
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
            {/*current time marker*/}
            <TodayMarker interval={1000}/>

            {/*milestones*/}
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
          <div className="explanatory-notes-container">
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
            {this.renderPopup(popup)}
            {/*undo redo*/}
            <div className="action-buttons">
              <button className={`action-button ${this.actions.length <= 0 ? 'disabled' : ''}`} onClick={this.undo}>
                Undo
              </button>
              <button className={`action-button ${this.redoActions.length <= 0 ? 'disabled' : ''}`} onClick={this.redo}>
                Redo
              </button>
            </div>
          </div>
        </div>

        {/*<div onClick={() => this.focusItems(items.filter(item => (item.id === 8 || item.id === 10)))}>
          focus
        </div>*/}
        </>
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