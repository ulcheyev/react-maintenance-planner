import React, {Component} from "react"
import moment from "moment"
import {HiOutlinePencil} from "react-icons/hi";
import {FaPlus, FaArrowUp, FaArrowDown} from 'react-icons/fa'

import Timeline, {
  TodayMarker,
  CustomMarker
} from "./timeline/src"
import './timeline/src/lib/Timeline.css'
import Xarrow from "react-xarrows"
import './../assets/PlanningTool.css'
import PropTypes from "prop-types"
import Popup from './Popup'
import Modal from './Modal'
import EditItemModal from './EditItemModal'
import Constants from '../constants/Constants'

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
      this.setItemDefaults(item)
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
    this.addResourceRefs = {
      name: React.createRef(),
      child: React.createRef(),
    }

    const addResourceModal = false

    const editItemModal = this.getEditItemModalDefaults()

    this.state = {
      groups,
      items,
      defaultTimeStart,
      defaultTimeEnd,
      sidebarWidth,
      sidebarResizing,
      lastSidebarWidth: sidebarWidth,
      popup,
      milestones,
      showIcons,
      addResourceModal,
      editItemModal,
    }
  }

  setItemDefaults = (item) => {
    item.title = item.title != null ? item.title : ''
    item.parent = item.parent != null ? item.parent : null
    item.className = item.className != null ? item.className : 'item'
    item.bgColor = item.bgColor != null ? item.bgColor : '#2196F3'
    item.color = item.color != null ? item.color : '#ffffff'
    item.selectedBgColor = item.selectedBgColor != null ? item.selectedBgColor : '#FFC107'
    item.selectedColor = item.selectedColor != null ? item.selectedColor : '#000000'
    item.draggingBgColor = item.draggingBgColor != null ? item.draggingBgColor : '#f00'
    item.highlightBgColor = item.highlightBgColor != null ? item.highlightBgColor : '#FFA500'
    item.highlight = item.highlight != null ? item.highlight : false
    item.canMove = item.canMove != null ? item.canMove : true
    item.canResize = item.canResize != null ? item.canResize : 'both'
    item.minimumDuration = item.minimumDuration != null ? item.minimumDuration : false
    item.maximumDuration = item.maximumDuration != null ? item.maximumDuration : false
  }

  getEditItemModalDefaults = () => {
    return {
      open: false,
      item: null,
      title: '',
      currentGroupId: null,
      onSubmit: this.handleEditItemModalSubmit,
      onClose: this.handleEditItemModalClose,
      mode: null,
    }
  }

  /**
   * Event handler when changing position of item
   */
  handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const {items, groups} = this.state

    const group = groups.filter(g => g.show)[newGroupOrder]

    this.addUndoItem(items.find(i => i.id === itemId), Constants.ITEM_EDIT, {}, true)

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

    this.addUndoItem(item, Constants.ITEM_EDIT, {}, true)

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

  highlightParents = (item) => {
    if (item.parent) {
      const parent = this.state.items.find(i => i.id === item.parent)
      parent.highlight = true
      this.highlightParents(parent)
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
  addUndoItem = (item, actionName, params = {}, removeRedos = false) => {
    if (removeRedos) {
      this.redoActions = []
    }
    this.actions.push({
      item: Object.assign({}, item),
      actionName,
      params,
    })
  }

  addRedoItem = (item, actionName, params = {}) => {
    this.redoActions.push({
      item,
      actionName,
      params,
    })
  }

  /**
   * Returns last change in component
   */
  undo = () => {
    if (this.actions.length <= 0) {
      return
    }

    const undoAction = this.actions.pop()

    if (undoAction.actionName === Constants.ITEM_EDIT) {
      this.undoItemEdit(undoAction)
      return
    }
    if (undoAction.actionName === Constants.ITEM_ADD) {
      this.undoItemAdd(undoAction)
      return
    }
    if (undoAction.actionName === Constants.RESOURCE_EDIT) {
      this.undoResourceEdit(undoAction)
      return
    }
    if (undoAction.actionName === Constants.RESOURCE_ADD) {
      this.undoResourceAdd(undoAction)
      return
    }
    if (undoAction.actionName === Constants.RESOURCE_REMOVE) {
      this.undoResourceRemove(undoAction)
      return
    }
    if (undoAction.actionName === Constants.RESOURCE_REORDER) {
      this.undoResourceReorder(undoAction)
      return
    }
  }

  undoItemAdd = (undoAction) => {
    const {items} = this.state

    const item = items.find(i => i.id === undoAction.item.id)
    const index = items.indexOf(item)
    if (index < 0) {
      return
    }

    this.addRedoItem(item, undoAction.actionName)

    items.splice(index, 1)

    this.setState({
      items
    })
  }

  undoResourceRemove = (undoAction) => {
    const {groups} = this.state
    const undoGroup = undoAction.item
    this.addRedoItem(undoGroup, undoAction.actionName)

    let index = undoAction.params.index
    groups.splice(index, 0, undoGroup)

    for (const child of undoAction.params.children) {
      groups.splice(++index, 0, child)
    }

    groups.find(g => g.id === undoGroup.parent).hasChildren = true

    this.setState({
      groups,
    })
  }

  undoResourceReorder = (undoAction) => {
    const {groups} = this.state

    const undoGroup = undoAction.item
    const direction = undoAction.params.direction
    this.addRedoItem(undoGroup, undoAction.actionName, {direction})

    this.handleReorderResource(null, groups.find(g => g.id === undoGroup.id), direction === 'up' ? 'down' : 'up', false)
  }

  undoResourceAdd = (undoAction) => {
    const {groups} = this.state
    const undoGroup = undoAction.item

    const group = groups.find(g => g.id === undoGroup.id)
    const parent = groups.find(p => p.id === group.parent)
    const index = groups.indexOf(group)

    if (index > -1) {
      groups.splice(index, 1)
      this.addRedoItem(group, undoAction.actionName, {
        index,
      })
    }

    if (groups.filter(g => g.parent === parent.id).length <= 0) {
      parent.hasChildren = false
    }

    this.setState({
      groups,
    })
  }

  undoResourceEdit = (undoAction) => {
    const {groups} = this.state
    const undoGroup = undoAction.item

    this.addRedoItem(groups.find(g => g.id === undoGroup.id), undoAction.actionName)

    this.setState({
      groups: groups.map(group =>
        group.id === undoGroup.id
          ? Object.assign({}, undoGroup)
          : group
      )
    })
  }

  undoItemEdit = (undoAction) => {
    const {items} = this.state
    const undoItem = undoAction.item

    this.addRedoItem(items.find(i => i.id === undoItem.id), undoAction.actionName)

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

    const redoAction = this.redoActions.pop()

    if (redoAction.actionName === Constants.ITEM_EDIT) {
      this.redoItemEdit(redoAction)
      return
    }
    if (redoAction.actionName === Constants.ITEM_ADD) {
      this.redoItemAdd(redoAction)
      return
    }
    if (redoAction.actionName === Constants.RESOURCE_EDIT) {
      this.redoResourceEdit(redoAction)
      return
    }
    if (redoAction.actionName === Constants.RESOURCE_ADD) {
      this.redoResourceAdd(redoAction)
      return
    }
    if (redoAction.actionName === Constants.RESOURCE_REMOVE) {
      this.redoResourceRemove(redoAction)
      return
    }
    if (redoAction.actionName === Constants.RESOURCE_REORDER) {
      this.redoResourceReorder(redoAction)
      return
    }
  }

  redoItemEdit = (redoAction) => {
    const {items} = this.state
    const redoItem = redoAction.item
    this.addUndoItem(items.find(i => i.id === redoItem.id), redoAction.actionName)

    this.setState({
      items: items.map(item =>
        item.id === redoItem.id
          ? Object.assign({}, redoItem)
          : item
      ),
      draggedItem: undefined
    })
  }

  redoItemAdd = (redoAction) => {
    const {items} = this.state
    const redoItem = redoAction.item

    this.addUndoItem(redoItem, redoAction.actionName)

    items.push(redoItem)
    this.setState({
      items,
    })
  }

  redoResourceEdit = (redoAction) => {
    const {groups} = this.state
    const redoGroup = redoAction.item
    this.addUndoItem(groups.find(g => g.id === redoGroup.id), redoAction.actionName)

    this.setState({
      groups: groups.map(group =>
        group.id === redoGroup.id
          ? Object.assign({}, redoGroup)
          : group
      )
    })
  }

  redoResourceAdd = (redoAction) => {
    const {groups} = this.state
    const redoGroup = redoAction.item
    this.addUndoItem(redoGroup, redoAction.actionName)

    groups.splice(redoAction.params.index, 0, redoGroup)
    groups.find(g => g.id === redoGroup.parent).hasChildren = true

    this.setState({
      groups,
    })
  }

  redoResourceRemove = (redoAction) => {
    const redoGroup = redoAction.item
    this.removeResource(redoGroup)
  }

  redoResourceReorder = (redoAction) => {
    const {groups} = this.state

    const redoGroup = redoAction.item
    const direction = redoAction.params.direction
    this.addUndoItem(redoGroup, redoAction.actionName, {direction})

    this.handleReorderResource(null, groups.find(g => g.id === redoGroup.id), direction, false)
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
              this.highlightParents(item)
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
          <div>
            {itemContext.title}
            {item.showIcons &&
              <div className="action-icons">
          <span
            onClick={(e) => this.editItem(item)}
            className="edit-icon">
            <HiOutlinePencil/>
          </span>
                <span className="remove-icon">
              <FaPlus/>
            </span>
              </div>
            }
          </div>
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

  handleRemoveResource = (e, group) => {
    e.stopPropagation()

    if (window.confirm(`Do you really want to remove resource ${group.title}?`) === true) {
      this.removeResource(group, true)
    }
  }

  removeResource = (group, removeRedos = false) => {
    const {groups} = this.state

    const index = groups.indexOf(group)
    if (index > -1) {
      const children = this.getAllChildren(group)
      this.addUndoItem(group, Constants.RESOURCE_REMOVE, {index, children}, removeRedos)

      const parent = groups.find(g => g.id === group.parent)
      groups.splice(index, 1)

      for (const child of children) {
        const index = groups.indexOf(child)

        if (index > -1) {
          groups.splice(index, 1)
        }
      }

      if (groups.filter(g => g.parent === parent.id).length <= 0) {
        parent.hasChildren = false
      }
    }

    this.setState({
      groups,
    })
  }

  getAllChildren = (group) => {
    let children = this.state.groups.filter(g => g.parent === group.id)

    for (const child of children.slice()) {
      children.splice(children.indexOf(child) + 1, 0, ...this.getAllChildren(child))
    }

    return children
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
      this.addUndoItem(group, Constants.RESOURCE_EDIT, {}, true)
      group.title = e.target.value
    }

    if (itemId) {
      const item = items.find(g => g.id === itemId)
      this.addUndoItem(item, Constants.ITEM_EDIT, {}, true)
      item.title = e.target.value
    }
  }

  handleInputFieldOnKeyUp = (e, groupId, itemId) => {
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
        placeholder="Ctrl+Enter / Escape"/>
    )
  }

  getHighestGroupTreeIndex = (group) => {
    if (!group.hasChildren) {
      return this.state.groups.indexOf(group)
    }

    return this.getHighestGroupTreeIndex(this.state.groups.filter(g => g.parent === group.id).slice(-1)[0])
  }

  handleAddResource = (group) => {
    this.setState({
      addResourceModal: group
    })
  }

  addResource = (group, title, child) => {
    const {groups} = this.state

    const newId = Math.max(...groups.map(object => {
      return object.id
    })) + 1

    const newGroup = {
      id: newId,
      level: group.level,
      open: false,
      parent: group.parent,
      show: true,
      showIcons: false,
      title: title,
    }

    let groupIndex
    if (child) {
      groupIndex = this.state.groups.indexOf(group)
      newGroup.parent = group.id
      newGroup.level = group.level + 1
      group.open = true
      group.hasChildren = true
    } else {
      groupIndex = this.getHighestGroupTreeIndex(group)
    }
    groups.splice(groupIndex + 1, 0, newGroup)

    this.setState({
      groups: groups,
      addResourceModal: false,
    })

    this.addUndoItem(newGroup, Constants.RESOURCE_ADD)
  }

  renderAddResourceModal = (group) => {
    return (
      <Modal
        title={`Add resource - ${group.title}`}
        onClose={() => {
          this.setState({
            addResourceModal: false,
          })
        }}
        onSubmit={() => {
          this.addResource(group, this.addResourceRefs.name.current.value, this.addResourceRefs.child.current.checked)
          this.addResourceRefs.name.current.value = ''
          this.addResourceRefs.child.current.checked = false
        }}
      >
        <label>
          Insert resource name
          <input type="text" placeholder="Resource name" ref={this.addResourceRefs.name}/>
        </label>
        <label>
          Do you want to create this resource as a child?
          <input type="checkbox" placeholder="yes" ref={this.addResourceRefs.child}/>
        </label>
      </Modal>
    )
  }

  handleReorderResource = (e, group, direction, addUndo = true) => {
    if (e) {
      e.stopPropagation()
    }

    const siblings = this.getSiblings(group)
    let {groups} = this.state
    if (siblings.length <= 0) {
      return
    }

    const siblingsIndex = siblings.indexOf(group)
    if (siblingsIndex < 0) {
      return
    }
    const groupsIndex = groups.indexOf(group)
    if (groupsIndex < 0) {
      return
    }

    if (direction === 'up') {
      if (siblingsIndex === 0) {
        return
      }

      if (addUndo) {
        this.addUndoItem(group, Constants.RESOURCE_REORDER, {direction}, true)
      }
      const siblingToSwapGroupsIndex = groups.indexOf(siblings[siblingsIndex - 1])

      const upperArray = groups.slice(0, groupsIndex)
      const lowerArray = groups.slice(groupsIndex)
      const onlySiblingArray = upperArray.splice(siblingToSwapGroupsIndex)
      let nextSiblingIndex = lowerArray.indexOf(siblings[siblingsIndex + 1])
      if (nextSiblingIndex < 0) {
        const children = this.getAllChildren(group)
        if (children.length > 0) {
          nextSiblingIndex = lowerArray.indexOf(children[children.length - 1]) + 1
        } else {
          nextSiblingIndex = 1
        }
      }
      const onlyGroupArray = lowerArray.splice(0, nextSiblingIndex)

      groups = [
        ...upperArray,
        ...onlyGroupArray,
        ...onlySiblingArray,
        ...lowerArray,
      ]
    } else if (direction === 'down') {
      if (siblingsIndex === siblings.length - 1) {
        return
      }

      if (addUndo) {
        this.addUndoItem(group, Constants.RESOURCE_REORDER, {direction}, true)
      }
      const siblingToSwapGroupsIndex = groups.indexOf(siblings[siblingsIndex + 1])

      const upperArray = groups.slice(0, siblingToSwapGroupsIndex)
      const lowerArray = groups.slice(siblingToSwapGroupsIndex)
      const onlyGroupArray = upperArray.splice(groupsIndex)
      let nextSiblingIndex = lowerArray.indexOf(siblings[siblingToSwapGroupsIndex + 1])
      if (nextSiblingIndex < 0) {
        const children = this.getAllChildren(groups[siblingToSwapGroupsIndex])
        if (children.length > 0) {
          nextSiblingIndex = lowerArray.indexOf(children[children.length - 1]) + 1
        } else {
          nextSiblingIndex = 1
        }
      }
      const onlySiblingArray = lowerArray.splice(0, nextSiblingIndex)

      groups = [
        ...upperArray,
        ...onlySiblingArray,
        ...onlyGroupArray,
        ...lowerArray,
      ]
    } else {
      return
    }

    group.showIcons = false
    this.setState({
      groups,
    })
  }

  getSiblings = (group) => {
    return this.state.groups.filter(g => g.parent === group.parent)
  }

  getGroupsTree = (defaultValue) => {
    const groups = this.state.groups

    return this.flatGroupToTree(groups, null, defaultValue)
  }

  flatGroupToTree = (groups, id = null, defaultValue = null) => {
    return groups
      .filter(group => group['parent'] === id)
      .map(group => ({
        label: group.title,
        value: group.id,
        isDefaultValue: group.id === defaultValue,
        children: this.flatGroupToTree(groups, group.id, defaultValue)
      }))
  }

  editItem = (item) => {
    if (!item) {
      return
    }

    const {editItemModal} = this.state

    this.setState({
      editItemModal: {
        ...editItemModal,
        currentGroupId: item.group,
        open: true,
        item: item,
        title: `Edit item - ${item.title}`,
        mode: 'edit',
      }
    })
  }

  renderEditItemModal = () => {
    const {editItemModal} = this.state

    if (!editItemModal.open) {
      return
    }

    const groups = this.getGroupsTree(editItemModal.currentGroupId)

    return (
      <EditItemModal
        title={editItemModal.title}
        item={editItemModal.item}
        currentGroupId={editItemModal.currentGroupId}
        groups={groups}
        onSubmit={editItemModal.onSubmit}
        onClose={editItemModal.onClose}
        mode={editItemModal.mode}
      />
    )
  }

  handleOnCanvasDoubleClick = (groupId, time) => {
    const {items, editItemModal} = this.state

    const startDate = moment(time), endDate = moment(time).add(1, 'hour')
    const lastId = Math.max(...items.map(i => i.id))

    const item = {
      id: lastId + 1,
      title: '',
      group: groupId,
      start: startDate,
      end: endDate,
    }

    this.setItemDefaults(item)
    items.push(item)

    this.setState({
      items,
      editItemModal: {
        ...editItemModal,
        currentGroupId: groupId,
        open: true,
        item: item,
        title: 'Add new item',
        mode: 'add',
      }
    })
  }

  handleEditItemModalSubmit = (item, data, mode) => {
    const {items} = this.state

    item = items.find(i => i.id === item.id)

    if (mode === 'add') {
      this.addUndoItem(item, Constants.ITEM_ADD, {}, true)
    } else if (mode === 'edit') {
      this.addUndoItem(item, Constants.ITEM_EDIT, {}, true)
    }

    data.date.from.month -= 1
    data.date.to.month -= 1

    item.title = data.title
    item.start = moment(data.date.from)
    item.end = moment(data.date.to)
    item.group = data.groupId
    item.color = data.color
    item.bgColor = data.bgColor

    const editItemModal = this.getEditItemModalDefaults()

    this.setState({
      items,
      editItemModal,
    })
  }

  handleEditItemModalClose = (item, mode) => {
    const {items} = this.state

    if (mode === 'add') {
      const index = items.indexOf(item)
      if (index > -1) {
        items.splice(index, 1)
      }
    }

    const editItemModal = this.getEditItemModalDefaults()

    this.setState({
      editItemModal,
      items,
    })
  }

  groupOnEnter = (target) => {
    if (this.state.sidebarResizing || !target) {
      return
    }

    let width = this.state.sidebarWidth
    if (target.scrollWidth > this.state.sidebarWidth) {
      width = target.scrollWidth + 10
    }
    this.setState({
      lastSidebarWidth: this.state.sidebarWidth,
      sidebarWidth: width,
    })
  }

  groupOnLeave = () => {
    if (this.state.sidebarResizing) {
      return
    }

    this.setState({
      sidebarWidth: this.state.lastSidebarWidth
    })
  }

  renderGroup = (group) => {
    const siblings = this.getSiblings(group)
    let ordering = false, orderDown = true, orderUp = true
    if (siblings.length > 1) {
      ordering = true
      if (siblings[0] === group) {
        orderUp = false
      }
      if (siblings[siblings.length - 1] === group) {
        orderDown = false
      }
    }

    return (
      <div
        className='resource-group'
      >
        <div
          className="resource"
          onClick={() => this.toggleGroup(group.id)}
          style={{cursor: 'pointer', paddingLeft: group.level * 20}}
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
            <div className="action-icons">
          <span
            onClick={(e) => this.handleEditMode(e, group.id)}
            className="edit-icon"><HiOutlinePencil/>
          </span>
              <span
                className="remove-icon action-icon"
                onClick={(e) => this.handleRemoveResource(e, group)}
              >
              <FaPlus/>
            </span>
              <div className="reorder-icons">
              <span
                onClick={(e) => this.handleReorderResource(e, group, 'up')}
                className={`order-up-icon order-icon ${ordering && orderUp ? '' : 'disabled'} action-icon`}>
                <FaArrowUp/>
              </span>
                <span
                  onClick={(e) => this.handleReorderResource(e, group, 'down')}
                  className={`order-down-icon order-icon ${ordering && orderDown ? '' : 'disabled'} action-icon`}>
                <FaArrowDown/>
              </span>
              </div>
            </div>
          }
        </div>

        {(group.showIcons || true)  &&
          <FaPlus className="add-resource" onClick={() => this.handleAddResource(group)}/>
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
            onMouseEnter={async (e) => {
              const {currentTarget} = e
              await this.handleShowIconsOnMouseEnter(group.id)
              this.groupOnEnter(currentTarget)
            }}
            onMouseLeave={() => {
              this.handleShowIconsOnMouseLeave(group.id)
              this.groupOnLeave()
            }}
            onKeyUp={(e) => this.handleInputFieldOnKeyUp(e, group.id)}
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
                    onItemDoubleClick={this.handleOnCanvasDoubleClick}
                    onCanvasDoubleClick={this.handleOnCanvasDoubleClick}
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
              <button className={`action-button ${this.redoActions.length <= 0 ? 'disabled' : ''}`}
                      onClick={this.redo}>
                Redo
              </button>
            </div>
          </div>
        </div>

        {this.state.addResourceModal &&
          this.renderAddResourceModal(this.state.addResourceModal)
        }

        {this.renderEditItemModal()}

        {/*<div onClick={() => this.focusItems(items.filter(item => (item.id === 8 || item.id === 10)))}>
          focus
        </div>*/}
      </>
    )
  }
}


PlanningTool
  .propTypes = {
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
      workTime: PropTypes.number,
      plannedWorkTime: PropTypes.number
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

PlanningTool
  .defaultProps = {
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