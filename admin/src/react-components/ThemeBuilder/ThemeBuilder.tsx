import React, {useEffect, useState} from 'react';
// import theme from "../../utils/sample-theme";
import {Button, Input, Select} from '@mozilla/lilypad-ui'

const ThemeBuilder = ({config}) => {
    const themes = JSON.parse(config?.hubs?.theme?.themes)
    const formattedThemes = themes.map(theme => ({title: theme.name, value: theme.id}));

    const [selectedTheme, setSelectedTheme] = useState(themes.find(theme => !!theme?.default))

    const onChange = e => {
        setSelectedTheme(themes.find(theme => theme.id === e.target.value))
    }

    const onSubmit = e => {
        e.preventDefault()
        console.log(selectedTheme)
    }

    const onVariableChange = (e, key )=> {
        console.log(e.target.value, key)
        e.preventDefault()
        e.persist()
        setSelectedTheme(prevState => {
            console.log(prevState)
           return {...prevState, variables: {...prevState.variables, [key]: e.target.value}}
        })
    }

    useEffect(() => {
        console.log(selectedTheme)
    }, [selectedTheme])

    return (
        <div>
            <Select label="Themes" options={formattedThemes} name="Themes" value={selectedTheme.id} onChange={onChange}/>
            <form onSubmit={onSubmit} >
                {Object.entries(selectedTheme.variables).map(([key, value]) => {
                    return <Input label={key} name={key} value={value} onChange={e => onVariableChange(e, key)}/>
                })}
                <Button type="submit" text="Submit" label="Submit" />
            </form>
        </div>
    )
}

export default ThemeBuilder