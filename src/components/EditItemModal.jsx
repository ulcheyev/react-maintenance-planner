import React, {useState} from "react"
import Modal from "./Modal"

import DateTimePicker from 'react-calendar-datetime-picker'
import 'react-calendar-datetime-picker/dist/index.css'

import DropdownTreeSelect from 'react-dropdown-tree-select'
import 'react-dropdown-tree-select/dist/styles.css'
import './../assets/DropdownSelect.css'

const EditItemModal = (props) => {

  const formRefs = {
    title: React.useRef(),
  }

  const {item} = props

  const dateDefaultValue = {
    from: {
      year: item.start.year(),
      month: item.start.month() + 1,
      day: item.start.date(),
      hour: item.start.hour(),
      minute: item.start.minute()
    },
    to: {
      year: item.end.year(),
      month: item.end.month() + 1,
      day: item.end.date(),
      hour: item.end.hour(),
      minute: item.end.minute()
    }
  }

  const [date, setDate] = useState(null)
  const [color, setColor] = useState(props.item?.color)
  const [bgColor, setBgColor] = useState(props.item?.bgColor)
  let groupId = props.currentGroupId

  const onChange = (currentNode, selectedNodes) => {
    groupId = currentNode.value
  }

  return (
    <Modal
      title={props.title}
      onClose={() => {
        props.onClose(item, props.mode)
      }}
      onSubmit={() => {
        props.onSubmit(item, {
          title: formRefs.title.current.value,
          date,
          groupId,
          color,
          bgColor,
        }, props.mode)
      }}
    >
      <label>
        Item title
        <input type="text" placeholder="Resource name" ref={formRefs.title}
               defaultValue={props.item?.title}/>
      </label>
      <label>
        Start date
      </label>
      <DateTimePicker
        onChange={setDate}
        initValue={dateDefaultValue}
        type="range"
        withTime
        showTimeInput
        autoClose={false}
      />
      <label>
        Select resource
      </label>
      <DropdownTreeSelect
        className="mdl-demo"
        data={props.groups}
        onChange={onChange}
        mode="radioSelect"
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          gap: 25
        }}
      >
        <label>
          Text
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
          />
        </label>
        <label>
          Background
          <input
            type="color"
            value={bgColor}
            onChange={e => setBgColor(e.target.value)}
          />
        </label>
      </div>
    </Modal>
  )
}

export default EditItemModal