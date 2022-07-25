import React, {useState} from "react"
import Modal from "./Modal"

import DateTimePicker from 'react-calendar-datetime-picker'
import 'react-calendar-datetime-picker/dist/index.css'

import DropdownTreeSelect from 'react-dropdown-tree-select'
import 'react-dropdown-tree-select/dist/styles.css'
import './../assets/DropdownSelect.css'

const EditItemModal = (props) => {

  const formRefs = {
    title: React.useRef()
  }

  const {item} = props

  const defaultValue = {
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
  let groupId = props.currentGroupId

  const onChange = (currentNode, selectedNodes) => {
    groupId = currentNode.value
  }

  return (
    <Modal
      title={props.title}
      onClose={() => {
        props.onClose(item)
      }}
      onSubmit={() => {
        props.onSubmit(item, {
          title: formRefs.title.current.value,
          date,
          groupId,
        })
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
        initValue={defaultValue}
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
    </Modal>
  )
}

export default EditItemModal