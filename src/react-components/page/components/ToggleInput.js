import React, {useContext, useEffect, useState} from "react";
import PropTypes from "prop-types";
import "./ToggleInput.scss";

export const ToggleInput = (props) => {
    const [checked, setChecked] = useState( props.checked || false);

    const handleChange = (evt)=>{
        setChecked(!checked);
        if(props.onChange){
            props.onChange(evt);
        }
    }

    return (
        <label className="toggle-input">
            <label className="track">
                <input
                    type="checkbox"
                    name={props.name}
                    disabled={props.disabled}
                    checked={checked}
                    onChange={handleChange}
                />
                <span className="button" />
            </label>
        </label>
    );
}

ToggleInput.propTypes = {
    name: PropTypes.string,
    checked: PropTypes.any,
    disabled: PropTypes.any,
    className: PropTypes.string,
    onChange: PropTypes.func,
};