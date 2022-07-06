import React, { useEffect, useState } from 'react';
import ReactDOM from "react-dom";
import registerTelemetry from "./telemetry";
import "./utils/theme";
import "./react-components/styles/global.scss";
import "./assets/larchiveum/manager.scss"
import Store from "./utilities/store";
import ExhibitionsService from './utilities/apiServices/ExhibitionsService'
import ReserveService from './utilities/apiServices/ReserveService'
import Popup from './react-components/popup/popup';
import AddIcon from './assets/larchiveum/add_black_24dp.svg';
import Moment from 'react-moment';
import 'reactjs-popup/dist/index.css';
import * as moment from 'moment'
import {toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import defaultImage from './assets/larchiveum/default-image.png'
import defaultImage1 from './assets/larchiveum/siri.gif'
import Pagination from './react-components/pagination/pagination'
import {APP_ROOT} from './utilities/constants'
import { FaUserFriends ,FaRegCalendarAlt ,FaLink,FaCog} from "react-icons/fa";

registerTelemetry("/manager", "Hubs Home Page");

function Root() {

  toast.configure();
  const [scenes, setScenes] = useState([]);
  const [exhibitionsLoaded, setExhibitionsLoaded] = useState(false);
  const [isOpenExhibition, setIsOpenExhibition] = useState(false);
  const [isOpenToggle, setIsOpenToggle] = useState(false);
  const [exhibition, setExhibition] = useState(undefined);
  const [exhibitionType, setExhibitionType] = useState('create');
  const [exhibitionId, setExhibitionId] = useState(undefined);
  const [exhibitions, setExhibitions] = useState({
    data: [],
    pagination: {},
  });
  const [filterExhibitionList, setfilterExhibitionList] = useState({
    page: 1,
    pageSize: 4,
    sort:'id|desc', //format <attribute>|<order type>
  })

  useEffect(() => {
    getAllExhibitions();
  },[filterExhibitionList.page])

  const getAllExhibitions = () =>{
    const Auth = Store.getUser();
    var data = filterExhibitionList;
    if (Auth) {
      ExhibitionsService.getAllWithAuthExhibitions(data).then((res) => {
        if(res.result == 'ok'){
          setExhibitions(res.data);
          setExhibitionsLoaded(true);
        }
        else if(res.result == 'fail' && res.error == 'get_exhibitions_fail')
        {
          toast.error('Get Exhibitions fail !', {autoClose:1000})
        }
      })
      ExhibitionsService.getAllScenes().then((res)=>{
        if(res.result == 'ok'){
          setScenes(res.data)
        }
        else if(res.result == 'fail' && res.error == 'get_exhibitions_fail')
        {
          toast.error('Get Exhibitions fail !', {autoClose:1000})
        }
      })
    } else {
      ExhibitionsService.getAllExhibitions(data).then((res) => {
        if(res.result == 'ok'){
          setExhibitions(res.data);
          setExhibitionsLoaded(true);
        }
        else if(res.result == 'fail' && res.error == 'get_exhibitions_fail')
        {
          toast.error('Get Exhibitions fail !', {autoClose:1000})
        }
      })
    }
  }

  const openPopupExhibition =(exhibition)=> {
    if(exhibition){
      setExhibition({
        id: exhibition.id,
        name: exhibition?.room?.name,
        description: exhibition?.room?.description,
        sceneId: exhibition.sceneId,
        startDate: exhibition.startDate,
        public: exhibition.public,
        maxSize: exhibition.maxSize,
      });
    }
    else{
      setExhibition(null);
    }
    setIsOpenExhibition(true);
  }

  const closePopupExhibition = ()=>{
    setIsOpenExhibition(false);
  }

  const openPopupPublic =(exhibitionId)=> {
    setExhibitionId(exhibitionId);
    setIsOpenToggle(true);
  }

  const closePopupPublic = ()=> {
    setIsOpenToggle(false);
  }

  const renderExhibitions = () => {
    return (
      <>
        {exhibitionsLoaded ? (
          <>
            {
              exhibitions.data.map((item, index) => {
                const PublishButton = () =>{
                  if(item.public == 1)
                  {
                    return(
                      <button className="btn btn-unpublish" onClick={()=>{openPopupPublic(item.id)}} data-id-exhibition ={item.id}>Private</button>
                    )
                  }
                  else
                  {
                    return(
                      <button className="btn btn-publish" onClick={()=>{openPopupPublic(item.id)}} data-id-exhibition ={item.id}>Public</button>
                    )
                  }
                }
                if(item.room)
                {
                  return (
                    <div key={item.id} className={'items'}>
                        <span className='name-tour'>{item.name}</span>
                        <img src={getSceneThumnail(item ? item.sceneId : undefined)} alt=""/>
                        <div className="content">
                            <div><span className='text-bold'>{item?.room?.name}</span></div>
                            <div className='d-flex'><FaLink className='IconFa'/> : <span className='ml-1'><a href={APP_ROOT + '/' +item.roomId} target="_blank">{APP_ROOT + '/' +item.roomId}</a></span></div>
                            <div className='d-flex'><FaUserFriends className='IconFa'/> : <span className='ml-1'> {item.reservationCount}/{item.maxSize}</span></div>
                            <div>
                                <div className='d-flex'>
                                    <FaRegCalendarAlt className='IconFa'/> :  
                                    <span className='ml-1'>
                                        <Moment format="YYYY-MM-DD hh:mma">
                                            {item.startDate}
                                        </Moment>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="btn-action">
                            <PublishButton/>
                            <button className="btn btn-edit" onClick={()=>{openPopupExhibition(item) , setExhibitionType('edit')}} data-id-exhibition ={item.id}>Edit</button>
                        </div>
                    </div>
                  )
                }
                else
                {
                  return (
                    <div key={item.id} className={'items'}>
                        <span className='name-tour'>This room is currently unavailable</span>
                        <img src={defaultImage1} alt=""/>
                        <div className="content">
                            <div><span className='text-bold'>This room is currently unavailable</span></div>
                            <div className='d-flex'><FaLink className='IconFa'/> : <span className='ml-1'><a href="#" target="_blank">NAN</a></span></div>
                            <div className='d-flex'><FaUserFriends className='IconFa'/> : <span className='ml-1'>NAN/NAN</span></div>
                            <div>
                                <div className='d-flex'>
                                    <FaRegCalendarAlt className='IconFa'/> :  
                                    <span className='ml-1'>
                                        <Moment format="YYYY-MM-DD hh:mma">
                                            {item.startDate}
                                        </Moment>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="btn-action">
                            <button className="btn btn-delete" >Delete</button>
                        </div>
                    </div>
                  )
                }
                
              })//.sort((item1, item2)=>item1.id < item2.id ? 1 : -1) 
            }
          </>
        ) : ( 
          <></>
        )}
      </>
    )
  }

  const IAuth =()=> {  
    const user = Store.getUser();
    if(user){
      return(
        <span className="display-name">
          <a className="gotoadmin" href={APP_ROOT + '/admin'}><FaCog className='icon-setting-admin'/> Admin </a>
          <span className="nameA">{user.displayName || user.email}</span> / <a className="gotohome" href='/'>Back Home </a>
        </span>
      ) 
    }
    else{
      return(
        <></>
      ) 
    }
  }

  const changePages = (page) => {
    setfilterExhibitionList({
        ...filterExhibitionList, page
    })
  }

  const AccountPermision =()=> {  
    const user = Store.getUser();
    if(user?.type >= 3){
      return(
        <div className="title" >List Tour Larchiveum
          <button className="btn btn-create" onClick={()=>{openPopupExhibition(),setExhibitionType('create')}} ><img src={AddIcon}/></button>
          <div className="col">
              {renderExhibitions()}
          </div>
          {exhibitionsLoaded ? (exhibitions.data.length > 0 ? <Pagination pagination={exhibitions.pagination} callFetchList={changePages} /> : null) : null}
        </div>
      )
    }
    else{
      return(
        <div className="title" >
          <div className="title_access_err">You do not have access <br/> Please login with an account manager to use this service</div>
        </div>
      )
    }
  }

  const handleChange = (evt) => {
    const value = evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
    setExhibition({...exhibition,[evt.target.name]: value});
  }

  const getSceneThumnail = (sceneId)=>{
    let thumbnailUrl = null;
    for (const scene of scenes) {
      if(scene.id === sceneId){
        thumbnailUrl = scene.thumbnailUrl;
        break;
      }
      else if(sceneId === undefined)
      {
        thumbnailUrl = defaultImage;
      }
    }
    return thumbnailUrl;
  }

  const ListScenes =()=>{
    const handleChangeSceneThubmnail = (e) => {
      for (const scene of scenes) {
        if(scene.id === e.target.value){
          setExhibition({...exhibition,[e.target.name]: e.target.value});
        }
      }
    }

    return (
      <>
        <div className="wrap-input100 validate-input">
          <select id="sceneSelection" className="input100" name="sceneId" value={exhibition ? exhibition.sceneId : undefined} onChange={handleChangeSceneThubmnail}>
            <option>---Choose Scene---</option>
            {
                scenes.map((item, index) => {
                return (<option key={index} value={ item.id}>{item.name}</option>)
              })
            }
          </select>
            <span className="focus-input100"></span>
        </div>
        <div className="p-t-13 p-b-9">
          <span className="txt1">
          Scene Thubmnail
          </span>
        </div>
        <img className="f-image-thumbnail" src={getSceneThumnail(exhibition ? exhibition.sceneId : undefined)} alt=""/>
      </>
    )
  }

  const handleCreate=()=>{
    const data = exhibition;
    ExhibitionsService.postCreateOne(data).then((res)=>{
      if(res.result == 'ok'){
        toast.success('Create new tour success !', {autoClose:5000})
        setIsOpenExhibition(false);
        // setExhibitions([...exhibitions, res.data]);
        window.location.reload();
      }
      else if(res.result == 'fail' && res.error == 'verify_token_fail')
      {
        toast.error('You do not have permission to change or create !', {autoClose:5000})
      }
      else if(res.result == 'fail' && res.error == 'create_exhibition_error')
      {
        toast.error('The number of people in 1 room exceeds the allowed limit of 50 people !', {autoClose:5000})
      }
      else if(res.result == 'fail' && res.error == 'invalid_name')
      {
        toast.error('name should be length 4-255 !', {autoClose:5000})
      }
      else if(res.result == 'fail' && res.error == 'invalid_maxSize')
      {
        toast.error('the number of people in the room cannot be less than 1 !', {autoClose:5000})
      }
      else if(res.result == 'fail' && res.error == 'invalid_startDate')
      {
        toast.error('You must select the start date !', {autoClose:5000})
      }
      else
      {
        toast.error('System error Please try again later !', {autoClose:5000})
      }
    })
  }

  const handleEdit=()=>{
    const data = exhibition;
    ExhibitionsService.putUpdateOne(data).then((res)=>{
      if(res.result == 'ok'){
        exhibitions.data.forEach(exhibition => {
          if(exhibition.id == res.data.id){
            toast.success('Edit Exhibition success !', {autoClose:5000})
            setIsOpenExhibition(false);
            getAllExhibitions();
          }
        });
      }
      else if(res.result == 'fail' && res.error == 'verify_token_fail')
      {
        toast.error('You do not have permission to change or create !', {autoClose:5000})
      }
      else if(res.result == 'fail' && res.error == 'create_exhibition_error')
      {
        toast.error('The number of people in 1 room exceeds the allowed limit of 50 people!', {autoClose:5000})
      }
      else if(res.result == 'fail' && res.error == 'invalid_name')
      {
        toast.error('name should be length 4-255 !', {autoClose:5000})
      }
      else if(res.result == 'fail' && res.error == 'invalid_maxSize')
      {
        toast.error('the number of people in the room cannot be less than 1 !', {autoClose:5000})
      }
      else if(res.result == 'fail' && res.error == 'invalid_startDate')
      {
        toast.error('You must select the start date !', {autoClose:5000})
      }
      else
      {
        toast.error('System error Please try again later !', {autoClose:5000})
      }
    })
  }

  const handelTogglePublic=(exhibitionId)=>{
    ExhibitionsService.patchTogglePublic(exhibitionId).then((res) => {
      if(res.result == 'ok'){
        exhibitions.data.forEach(exhibition => {
          if(exhibition.id == exhibitionId){
            exhibition.public = res.data.public;
            toast.success('Change status success !', {autoClose:5000})
          }
        });
        setIsOpenToggle(!isOpenToggle);
      }
      else if(res.result == 'fail' && res.error =='invalid_id')
      {
        toast.error('exhibition id is incorrect !', {autoClose:5000})
      }
      else
      {
        toast.error('System error Please try again later !', {autoClose:5000})
      }
      
    })
  }

  return (
      <>
        {isOpenExhibition && <Popup
          size={'xl'}
          title={ exhibitionType == 'edit' ? <>Edit Exhibition </> : <> Create Exhibition</>}
          content={<>
            <form className="create100-form validate-form d-flex" name="form">
              <div className='w-60'>
                <div className="p-t-13 p-b-9">
                    <span className="txt1">
                    Name Exhibition
                    </span>
                </div>
                <div className="wrap-input100 validate-input">
                    <input className="input100" type="text" name="name" value={exhibition ? exhibition.name : undefined} onChange={handleChange} placeholder='Name Tour' />
                    <span className="focus-input100"></span>
                </div>
                  <div className="p-t-13 p-b-9">
                    <span className="txt1">
                    Description 
                    </span>
                  </div>
                  <div className="wrap-input100 validate-input">
                      <textarea className="textarea100"  name="description" value={exhibition ? exhibition.description : undefined} onChange={handleChange} placeholder='Description about tour' rows="10"></textarea>
                      <span className="focus-input100"></span>
                  </div>
                  <div className="p-t-13 p-b-9">
                    <span className="txt1">
                    Public
                    </span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" name='public' checked={exhibition ? exhibition.public: undefined} onChange={handleChange}/>
                    <span className='slider'></span>
                  </label>
              </div>
              <div className='w-40'>
              <div  className="d-flex-form">
                  <div className='item-input'>
                    <div className="p-t-13 p-b-9">
                      <span className="txt1">
                        Max Size
                      </span>
                      </div>
                      <div className="wrap-input100 validate-input">
                        <input className="input100" type="number" min={0} max={50} name="maxSize" value={exhibition ? exhibition.maxSize : 1} onChange={handleChange}/>
                        <span className="focus-input100"></span>
                      </div>
                  </div>
                  <div className='item-input'>
                    <div className="p-t-13 p-b-9">
                      <span className="txt1">
                        Start day
                      </span>
                      </div>
                      <div className="wrap-input100 validate-input">
                        <input className="input100" type="date" name="startDate" placeholder="dd-mm-yyyy" value={exhibition ? exhibition.startDate : undefined} onChange={handleChange}/>
                        <span className="focus-input100"></span>
                      </div>
                  </div>
                </div>
                <div className="p-t-13 p-b-9">
                    <span className="txt1">
                    List Scene 
                    </span>
                </div>
                <ListScenes/>
              </div>
            </form>
          </>}
          actions={[
              {
                  text: exhibitionType == 'edit' ? "Edit" :"Create",
                  class: "btn-handle",
                  callback: ()=>{ exhibitionType == 'edit' ? handleEdit() : handleCreate()},
              },
              {
                  text: "Cancel",
                  class: "btn-cancle",
                  callback: ()=>{closePopupExhibition()},
              },
          ]}
          handleClose={()=>{closePopupExhibition()}}
        />}

        {isOpenToggle && <Popup
          title={<>Change public status</>}
          size={'sm'}
          content={<>
              <br/>
              Are you sure Change this public status ?
              <br/>
              <br/>
          </>}
          actions={[
              {
                  text: "Change",
                  class: "btn1",
                  callback: ()=>{handelTogglePublic(exhibitionId)},
              },
              {
                  text: "Cancel",
                  class: "btn2",
                  callback: ()=>{closePopupPublic()},
              },
          ]}
          handleClose={closePopupPublic}
        />}

        <div className='manager-page'>
          <div className="row_1">
            <a href="/"><span className="text_1"> Larchiveum </span></a> 
            <IAuth/>
          </div>

          <div className="row_2">
              <AccountPermision/>
          </div>
        </div>
      </>
    );
}  
ReactDOM.render(<Root />, document.getElementById("manager-root"));