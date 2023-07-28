import React, {useEffect, useMemo, useState} from 'react';
// import theme from "../../utils/sample-theme";
import {Button, Input, Select} from '@mozilla/lilypad-ui'

const ThemeBuilder = ({config, onGlobalChange, onSave, path}) => {
    const [themes, setThemes] =useState(JSON.parse(config?.hubs?.theme?.themes))
    const [selectedTheme, setSelectedTheme] = useState(themes.find(theme => !!theme?.default))
    const formattedThemes = useMemo(() => themes.map(theme => ({title: theme.name, value: theme.id})), [themes]);

    const onThemeSelect = e => {
        setSelectedTheme(themes.find(theme => theme.id === e.target.value))
    }

    const onSubmit = e => {
        onSave(e)
        setThemes(prevState => [...prevState.filter(theme => theme.id !== selectedTheme.id), selectedTheme])
    }

    const onVariableChange = (e, key )=> {
        e.preventDefault()
        e.persist()
        setSelectedTheme(prevState => ({...prevState, variables: {...prevState.variables, [key]: e.target.value}}))
        console.log([...themes.filter(theme => theme.id !== selectedTheme.id), {...selectedTheme, variables: {...selectedTheme.variables, [key]: e.target.value}}])
        onGlobalChange(path, JSON.stringify([...themes.filter(theme => theme.id !== selectedTheme.id), {...selectedTheme, variables: {...selectedTheme.variables, [key]: e.target.value}}]))
    }
    
    return (
        <div>
            <Select label="Themes" options={formattedThemes} name="Themes" value={selectedTheme.id} onChange={onThemeSelect}/>
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