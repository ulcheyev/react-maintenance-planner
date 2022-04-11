import PropTypes from 'prop-types'
import React, {Component} from 'react'

import {_get, arraysEqual} from '../utility/generic'

export default class Sidebar extends Component {
  static propTypes = {
    groups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    groupHeights: PropTypes.array.isRequired,
    keys: PropTypes.object.isRequired,
    groupRenderer: PropTypes.func,
    isRightSidebar: PropTypes.bool,
    handleSidebarResize: PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = {
      width: props.width,
      resizing: false,
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(
      nextProps.keys === this.props.keys &&
      nextProps.width === this.props.width &&
      nextProps.height === this.props.height &&
      arraysEqual(nextProps.groups, this.props.groups) &&
      arraysEqual(nextProps.groupHeights, this.props.groupHeights) &&
      nextProps.width === this.props.width
    )
  }

  renderGroupContent(group, isRightSidebar, groupTitleKey, groupRightTitleKey) {
    if (this.props.groupRenderer) {
      return React.createElement(this.props.groupRenderer, {
        group,
        isRightSidebar
      })
    } else {
      return _get(group, isRightSidebar ? groupRightTitleKey : groupTitleKey)
    }
  }

  componentDidUpdate(props, state, foo) {
    if (this.props.handleSidebarResize.resizing && !props.handleSidebarResize.resizing) {
      document.addEventListener('mousemove', this.props.handleSidebarResize.move)
      document.addEventListener('mouseup', this.props.handleSidebarResize.up)
    } else if (!this.props.handleSidebarResize.resizing && props.handleSidebarResize.resizing) {
      document.removeEventListener('mousemove', this.props.handleSidebarResize.move)
      document.removeEventListener('mouseup', this.props.handleSidebarResize.up)
    }
  }

  onSidebarDown = (e) => {
    this.props.handleSidebarResize.down(e)
  }

  render() {
    const {groupHeights, height, width, isRightSidebar} = this.props
    const {groupIdKey, groupTitleKey, groupRightTitleKey} = this.props.keys

    const sidebarStyle = {
      width: `${width}px`,
      height: `${height}px`
    }

    const groupsStyle = {
      width: `${width}px`
    }

    let groupLines = this.props.groups.map((group, index) => {
      const elementStyle = {
        height: `${groupHeights[index]}px`,
        lineHeight: `${groupHeights[index]}px`
      }

      return (
        <div
          key={_get(group, groupIdKey)}
          className={
            'rct-sidebar-row rct-sidebar-row-' + (index % 2 === 0 ? 'even' : 'odd')
          }
          style={elementStyle}
        >
          {this.renderGroupContent(
            group,
            isRightSidebar,
            groupTitleKey,
            groupRightTitleKey
          )}
        </div>
      )
    })

    return (
      <div
        className={'rct-sidebar' + (isRightSidebar ? ' rct-sidebar-right' : '')}
        style={sidebarStyle}
      >
        <div style={groupsStyle}>{groupLines}</div>
        <div
          className={'rct-sidebar-resize'}
          onMouseDown={this.onSidebarDown}
        />
      </div>
    )
  }
}
