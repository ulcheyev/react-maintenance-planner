import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const ProgressBar = ({ progress }) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
        setValue(progress * getWidth());
    }, [progress]);

    const getWidth = () => {
        const element = document.querySelector('.progress-bar-container')
        if (element) {
            return parseInt(getComputedStyle(element).width.replace("px", ""));
        }
    }

    return (
        <div className="progress-bar-container">
            <div style={{width:`${value}px`}} className="progress-bar" />
        </div>
    )
}

export default ProgressBar;

ProgressBar.propTypes = {
    progress: PropTypes.number.isRequired
}