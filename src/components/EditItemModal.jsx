import React, {useState} from "react"
import Modal from "./Modal"

import DateTimePicker from 'react-calendar-datetime-picker'
import 'react-calendar-datetime-picker/dist/index.css'

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

  return (
    <Modal
      title={props.title}
      onClose={() => {
        props.onClose()
      }}
      onSubmit={() => {
        props.onSubmit(item, {
          title: formRefs.title.current.value,
          date,
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
    </Modal>
  )
}

export default EditItemModal