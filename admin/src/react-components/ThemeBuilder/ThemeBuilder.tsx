import React, { useEffect, useMemo, useRef, useState} from 'react';
// import theme from "../../utils/sample-theme";
import {Button, Input, Notification, NotificationInterfaceT, Select, TextArea} from '@mozilla/lilypad-ui'
import { NewNotificationT } from '@mozilla/lilypad-ui';
import { CategoryE } from '@mozilla/lilypad-ui';
import { NotificationTypesE } from '@mozilla/lilypad-ui';
import { NotificationLocationE } from '@mozilla/lilypad-ui';

type themeT = {
    name: string,
    variables: Record<string, string>,
    id: string;
    default?: boolean
}

type ThemeBuilderP = {
    config: Record<string, any>,
    onGlobalChange: (path:string, val: string) => void,
    onSave: (e:React.SyntheticEvent) => void,
    setState: (state:Record<string, any>) => void,
    path: string,
    disableSave: boolean,
}

const success: NewNotificationT = {
    title: "",
    description: "Copied them JSON to clipboard!",
    type: NotificationTypesE.SUCCESS,
    location: NotificationLocationE.BOTTOM_LEFT,
    autoClose: true,
    category:CategoryE.CRUMB,
  };
const error: NewNotificationT = {...success, type: NotificationTypesE.ERROR, description: "Unable to copy JSON to clipboard."}

const ThemeBuilder = ({config, onGlobalChange, onSave, path, setState, disableSave}:ThemeBuilderP) => {
    const [themes, setThemes] =useState<themeT[]>(JSON.parse(config?.hubs?.theme?.themes))
    const [selectedTheme, setSelectedTheme] = useState<themeT>(themes.find(theme => !!theme?.default) || themes[0])
    const [jsonInput, setJsonInput] = useState("")
    const [jsonError, setJsonError] = useState("")
    const formattedThemes = useMemo(() => themes.map(theme => ({title: theme.name, value: theme.id})), [themes, config]);
    const notificationRef = useRef<NotificationInterfaceT>();

    useEffect(() => {
        console.log(config)
    }, [config])

    const onThemeSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
        e.preventDefault()
        setSelectedTheme(themes.find(theme => theme.id === e.target.value))
    }

    const onSubmit = (e: React.SyntheticEvent) => {
        onSave(e)
        setThemes(prevState => [...prevState.filter(theme => theme.id !== selectedTheme.id), selectedTheme])
    }

    const onVariableChange = (e:React.ChangeEvent<HTMLInputElement>, key:string )=> {
        e.preventDefault()
        e.persist()
        setSelectedTheme(prevState => ({...prevState, variables: {...prevState.variables, [key]: e.target.value}}))
        onGlobalChange(path, JSON.stringify([...themes.filter(theme => theme.id !== selectedTheme.id), {...selectedTheme, variables: {...selectedTheme.variables, [key]: e.target.value}}]))
    }

    const onNameChange = (e:React.ChangeEvent<HTMLInputElement> )=> {
        e.preventDefault()
        e.persist()
        setSelectedTheme(prevState => ({...prevState, name: e.target.value}))
        onGlobalChange(path, JSON.stringify([...themes.filter(theme => theme.id !== selectedTheme.id), {...selectedTheme, name: e.target.value}]))

        if(themes.find(theme => theme.name === e.target.value)){
            const warningMessage = "Theme already exists with this name. Please use a different name."
            setState({warningMessage})
        } else {
            setState({warningMessage: null})
        }
    }

    const addTheme = () => {
        const newTheme = {
            ...themes[0],
            id: "new-theme", //TO DO: use UUID
            name: "New Theme"
        }
        onGlobalChange(path, JSON.stringify([...themes, newTheme]))
        setThemes(prevState => [...prevState, newTheme])
        setSelectedTheme(newTheme)
    }

    const deleteTheme = (e:React.SyntheticEvent) => {
        onGlobalChange(path, JSON.stringify(themes.filter(theme => theme.id !== selectedTheme.id)))
        setThemes(prevState => prevState.filter(theme => theme.id !== selectedTheme.id))
        setSelectedTheme(themes[0])
        onSave(e)
    }

    const copyThemeJson = () => {
        navigator.clipboard.writeText(JSON.stringify(selectedTheme)).then(() => {
            notificationRef.current?.dispatchNotification(success);
            /* text copied to clipboard successfully */
          },() => {
            notificationRef.current?.dispatchNotification(error);
            /* text failed to copy to the clipboard */
          });
    }

    const importThemeFromJson = (e:React.SyntheticEvent) => {
        e.preventDefault()
        const newTheme = e.target[0].value;
        setSelectedTheme(JSON.parse(newTheme))
        console.log(newTheme)
    }

    const duplicateSelectedTheme = () => {
        const newTheme = {
            ...selectedTheme,
            id: `${selectedTheme.id}-copy`, //TO DO: use UUID
            name: `${selectedTheme.name} Copy`,
        }

        setThemes(prevState => [...prevState, newTheme])
        onGlobalChange(path, JSON.stringify([...themes, newTheme]))
        setSelectedTheme(newTheme)
    }

    const validateJson = (value:string) => {
        if(value){ 
            try {
                const parsedValue = JSON.parse(value);
                const containsKeys = ['name', 'variables', 'id'].every(key => !!parsedValue[key])
                if(!containsKeys){
                    throw new Error("Missing one of the following keys: name, variables, id")
                }
                setJsonError('')
                return true;
            } catch (error) {
                setJsonError(error.message)
                return false;
            }
        }
        return true
    }

    const  adjustHexColor = (hex:string, percent:number) => {
        // Validate input
        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
          throw new Error("Invalid hex color code");
        }
      
        // Convert hex to RGB
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5), 16);
      
        // Calculate lighten or darken values. A negative percent darkens.
        r = Math.min(255, r + Math.round(255 * (percent / 100)));
        g = Math.min(255, g + Math.round(255 * (percent / 100)));
        b = Math.min(255, b + Math.round(255 * (percent / 100)));
      
        // Convert back to hex
        const newHex = `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
      
        return newHex;
      }

    // edit name and validate no duplicates
    // add new theme
    // duplicate theme
    // generate id from theme name???
    // copy json
    // import theme from json - validate and populate missing variables
    // delete theme
    // calculate darkness or lightness from states

    // import theme from web url?? - validate and populate missing variables
    // select from github themes
    // populate with defaults

    return (
        <div>
            <Select label="Themes" options={formattedThemes} name="Themes" value={selectedTheme.id} onChange={onThemeSelect}/>
            <Button type="button" text="Add theme" label="Add theme" onClick={e => addTheme(e)}/>
            <Button type="button" text="Delete theme" label="Delete theme" onClick={deleteTheme}/>
            <Button type="button" text="Copy theme json" label="Copy theme json" onClick={copyThemeJson}/>
            <Button type="button" text="Duplicate theme" label="Duplicate theme" onClick={duplicateSelectedTheme}/>
            <form onSubmit={importThemeFromJson}>
                <TextArea label="Theme" name="Theme" value={jsonInput} validator={validateJson} placeholder={''} customErrorMessage={jsonError} onChange={e => setJsonInput(e.target.value)}/>
                <Button type="submit" text="Import theme from JSON" label="Import theme from JSON"/>
            </form>
            <form onSubmit={onSubmit} >
                <Input label="Name" name="Name" value={selectedTheme.name} onChange={onNameChange} placeholder="Name your theme" />
                {Object.entries(selectedTheme.variables).map(([key, value]) => {
                    return <Input key={key} label={key} name={key} value={value} onChange={e => onVariableChange(e, key)} placeholder={''}/>
                })}
                <Button type="submit" text="Submit" label="Submit" disabled={disableSave}/>
            </form>
            <Notification ref={notificationRef} />
        </div>
    )
}

export default ThemeBuilder