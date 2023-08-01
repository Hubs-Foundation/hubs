import React, {useEffect, useMemo, useState} from 'react';
// import theme from "../../utils/sample-theme";
import {Button, Input, Select} from '@mozilla/lilypad-ui'

const ThemeBuilder = ({config, onGlobalChange, onSave, path, setState, disableSave}) => {
    const [themes, setThemes] =useState(JSON.parse(config?.hubs?.theme?.themes))
    const [selectedTheme, setSelectedTheme] = useState(themes.find(theme => !!theme?.default))
    const formattedThemes = useMemo(() => themes.map(theme => ({title: theme.name, value: theme.id})), [themes, config]);

    const onThemeSelect = e => {
        e.preventDefault()
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
        onGlobalChange(path, JSON.stringify([...themes.filter(theme => theme.id !== selectedTheme.id), {...selectedTheme, variables: {...selectedTheme.variables, [key]: e.target.value}}]))
    }

    const onNameChange = (e )=> {
        e.preventDefault()
        e.persist()
        setSelectedTheme(prevState => ({...prevState, name: e.target.value}))
        onGlobalChange(path, JSON.stringify([...themes.filter(theme => theme.id !== selectedTheme.id), {...selectedTheme, name: e.target.value}]))
        console.log(themes, e.target.value)
        if(themes.find(theme => theme.name === e.target.value)){
            const warningMessage = "Theme already exists with this name. Please use a different name."
            setState({warningMessage})
        } else {
            setState({warningMessage: null})
        }
    }

    const addTheme = e => {
        const newTheme = {
            ...themes[0],
            id: "new-theme", //TO DO: use UUID
            name: "New Theme"
        }
        setThemes(prevState => [...prevState, newTheme])
        setSelectedTheme(newTheme)
        onSave(e)
    }

    const deleteTheme = e => {
        setThemes(prevState => prevState.filter(theme => theme.id !== selectedTheme.id))
        setSelectedTheme(themes[0])
        onSave(e)
    }

    // edit name and validate no duplicates
    // add new theme
    // duplicate theme
    // generate id from theme name?
    // copy json
    // import theme from json - validate and populate missing variables
    // import theme from web url?? - validate and populate missing variables
    // select from github themes
    // delete theme
    // populate with defaults
    // calculate darkness or lightness from states

    return (
        <div>
            <Select label="Themes" options={formattedThemes} name="Themes" value={selectedTheme.id} onChange={onThemeSelect}/>
            <Button type="button" text="Add theme" label="Add theme" onClick={e => addTheme(e)}/>
            <Button type="button" text="Delete theme" label="Delete theme" onClick={deleteTheme}/>
            <form onSubmit={onSubmit} >
                <Input label="Name" name="Name" value={selectedTheme.name} onChange={onNameChange} placeholder="Name your theme" />
                {Object.entries(selectedTheme.variables).map(([key, value]) => {
                    return <Input key={key} label={key} name={key} value={value} onChange={e => onVariableChange(e, key)}/>
                })}
                <Button type="submit" text="Submit" label="Submit" disabled={disableSave}/>
            </form>
        </div>
    )
}

export default ThemeBuilder