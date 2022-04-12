import React, { useEffect, useState } from 'react';
import ReactDOM from "react-dom";
import registerTelemetry from "./telemetry";
import "./utils/theme";
import "./react-components/styles/global.scss";
import "./assets/larchiveum/style.scss"
import * as moment from 'moment'
import Store from "./utilities/store";
import ExhibitionsService from './utilities/apiServices/ExhibitionsService'
import ReserveService from './utilities/apiServices/ReserveService'
import Popup from './react-components/popup/popup';
import LogoCompany from './assets/larchiveum/logoC.png';
import Moment from 'react-moment';
import 'reactjs-popup/dist/index.css';
import {toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pagination from './react-components/pagination/pagination'
import { APP_ROOT } from './utilities/constants';
import defaultImage from './assets/larchiveum/siri.gif'
// ICON
import { MdPeopleAlt , MdCalendarToday , MdOutlineCheckCircleOutline ,MdOutlineLogout ,MdOutlineAccountCircle} from "react-icons/md";

registerTelemetry("/home", "Hubs Home Page");

function Root() {

  toast.configure();
  const [exhibitionsLoaded, setExhibitionsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenNotification, setIsOpenNotification] = useState(false);
  const [currentExhibitionId,setCurrentExhibitionId] = useState(null);
  const [exhibitions, setExhibitions] = useState({
    data: [],
    pagination: {},
  });
  const [exhibitionNoti, setExhibitionNoti] = useState(undefined);
  
  const [filterExhibitionList, setfilterExhibitionList] = useState({
    page: 1,
    pageSize: 9,
    sort:'startDate|asc', //format <attribute>|<order type>
  })

  const togglePopup = (exhibitionId) => {
    setIsOpen(!isOpen);
    setCurrentExhibitionId(exhibitionId);
  }

  useEffect(() => {
    getAllExhibitions();
  },[filterExhibitionList.page])


  const getAllExhibitions = () =>{
    var data = filterExhibitionList;
    const Auth = Store.getUser();
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
  
  const handleRemoveCookie =()=> {
    Store.removeUser();
    window.location.reload();
  }

  const handleButtonVisit =(event)=> {
    if(Store.getUser()){
      var idrooom = event.currentTarget.getAttribute('data-roomid')
      console.log(idrooom);
      if (idrooom == null || idrooom == '')
      {
        
      }
      else
      {
        window.location.href=APP_ROOT+'/'+idrooom;
        //console.log(APP_ROOT+'/'+idrooom)
      }
    }
    else{
        window.location = '/signin';
    }
  }

  const openPopupReservation =(event)=> {
    var exhibitionId = event.currentTarget.getAttribute('data-id-exhibition');
    //console.log(exhibitionId, access_token);
    togglePopup(exhibitionId);
  }

  const handleReservate =()=> {
    console.log(currentExhibitionId);
    const exhibitionId = currentExhibitionId;
    ReserveService.createReservations(exhibitionId).then((res) => {
      if(res.result == 'ok'){
        exhibitions.data.forEach(exhibition => {
          if(exhibition.id == exhibitionId){
            exhibition.reservated = true;
            exhibition.reservationCount = exhibition.reservationCount + 1;
            toast.success('Successful reservation!', {autoClose:1000})
          }
        });
        setIsOpen(!isOpen);
      }
      else if(res.result == 'fail')
      {
        toast.error('Error reservation!', {autoClose:1000})
      }
      
    })
  }

  const changePages = (page) => {
    setfilterExhibitionList({
        ...filterExhibitionList, page
    })
  }

  const renderExhibitions = () => {
    return (
      <>
        {exhibitionsLoaded ? (
          <>
            {
              exhibitions.data.sort(function (item1, item2) {
                var dateA = new Date(item1.startDate);
                var dateB = new Date(item2.startDate);
                if (dateB > dateA) {
                  return -1;
                } else {
                  return 1;
                }
              }).map((item, index) => {
                const ButtonVisit =()=>{
                  if(Store.getUser()){
                    var today = new Date().setHours(0,0,0,0);  
                    var startday = new Date(item.startDate).setHours(0,0,0,0);  
                    if(item.reservated == true)
                    {
                      if(today<startday)
                      {
                        return(
                          <>
                           <button className="signin-up btn-visit nt-time-yet" onClick={()=>{openPopupNotification(item)}} data-id-exhibition ={item.id}>It's not time yet</button>
                          </>
                         )
                      }
                      else{
                        return(
                          <>
                           <div className="span3">
                             <MdOutlineCheckCircleOutline size={37} color='#FFF'/>
                           </div>
                           <button className="signin-up btn-visit reserved" onClick={handleButtonVisit} data-roomid ={item.roomId}>Visit tour</button>
                          </>
                         )
                      }
                    }
                    else
                    {
                      if(today > startday)
                      {
                        return(
                          <button className="signin-up btn-visit reserved" onClick={handleButtonVisit} data-roomid ={item.roomId}>Visit tour</button>
                          )
                      }
                      else if(today <= startday)
                      {
                        if(item.reservationCount < item.maxSize)
                        {
                          return(
                            <button className="signin-up btn-visit" onClick={openPopupReservation} data-id-exhibition ={item.id}>Reservation</button>
                          )
                        }
                        else 
                        {
                          return(
                            <button className="signin-up btn-visit full" >The room is full</button>
                          )
                        }
                      }
                    }
                  }
                  else{
                    return(
                      <button className="signin-up btn-visit" onClick={handleButtonVisit}>Visit tour</button>
                    ) 
                  }
                }
                if(item.room)
                {
                  return (
                    <div key={index} className={'items'}>
                      <img src={item?.room?.thumbnailUrl} alt=""/>
                      <ButtonVisit/>
                      <div className="span1">{item?.room?.name}</div>
                      <div className="span2"> 
                        <p className="p-1"><MdPeopleAlt/>{item.reservationCount}/{item.maxSize}</p>
                        <p className="p-1">
                          <MdCalendarToday/>
                          <Moment format="YYYY-MM-DD">
                            {item.startDate}
                          </Moment>
                        </p>
                      </div>
                    </div>
                  )
                }
                else{
                  return (
                    <div key={index}  className={'items'}>
                      <img src={defaultImage} alt=""/>
                      {/* <ButtonVisit/> */}
                      <div className="span1-1">This room is currently unavailable</div>
                    </div>
                  )
                }
              })
            }
          </>
        ) : ( 
          <></>
        )}
      </>
    )
  }

  const UIAuth =()=> {  
    const userInfo = Store.getUser();
    if(userInfo){
      const ManagerBtn =()=> {
        if(userInfo.type == 3)
        {
          return(
            <a className="manager" href='./manager'> Manager </a> 
          )
        }
        else{
          return(
            <></>
          )
        }
      }
      return(
        <span className="display-name">
          <ManagerBtn/>
          <span className="nameA"> {userInfo.displayName || userInfo.email}</span> <a className="logout" onClick={handleRemoveCookie}><MdOutlineLogout size={28} color='#111'/></a>
        </span>
      ) 
    }
    else{
      return(
        <a href="/signin" className="signin-up">SignIn/SignUp</a>
      ) 
    }
  }
  
  const openPopupNotification =(exhibitionNoti)=> {
    if(exhibitionNoti){
      setExhibitionNoti({
        name: exhibitionNoti?.room?.name,
        description: exhibitionNoti?.room?.description,
        sceneId: exhibitionNoti.sceneId,
        thumbnailUrl: exhibitionNoti?.room?.thumbnailUrl,
        startDate: moment(exhibitionNoti.startDate).format('YYYY-MM-DD'),
        maxSize: exhibitionNoti.maxSize,
      });
    }
    else{
      setExhibitionNoti(null);
    }
    setIsOpenNotification(true);
  }

  const closePopupNotification = ()=>{
    setIsOpenNotification(false);
  }

  return (
    <>
      {isOpen && <Popup
        size={'sm'}
        title={<>Reserve</>}
        content={<>
            <br />
            Are you sure you want to make a reservation?
            <br/>
            <br/>
        </>}
        actions={[
            {
                text: "Reserve",
                class: "btn1",
                callback: ()=>{handleReservate()},
            },
            {
                text: "Cancle",
                class: "btn2",
                callback: ()=>{togglePopup()},
            },
        ]}
        handleClose={togglePopup}
      />}

      {isOpenNotification && <Popup
        size={'lg'}
        title={<>Notification</>}
        content={<>
          <div className='info-room'>
            <p className='noti-title'>It's not time to attend, please come back later</p>

            <div className='d-flex'>
                <div className='w-40'>
                  <img src={exhibitionNoti?exhibitionNoti.thumbnailUrl : defaultImage}/>
                </div>
                <div className='w-60'>
                  <p><span className='text-bold'>Name : </span> {exhibitionNoti ? exhibitionNoti.name : undefined}</p>
                  <p><span className='text-bold'>start Date : </span> {exhibitionNoti ? exhibitionNoti.startDate : undefined}</p>
                  <p><span className='text-bold'>Room Size : </span> {exhibitionNoti ? exhibitionNoti.maxSize : undefined}</p>
                  <p><span className='text-bold'>Description : </span> {exhibitionNoti ? exhibitionNoti.description : undefined}</p>
                </div>
            </div>
          </div>
        </>}
        actions={[
            {
                text: "Cancle",
                class: "btn2",
                callback: ()=>{closePopupNotification()},
            },
        ]}
        handleClose={closePopupNotification}
      />}

      <div className="row_1">
        <span className="text_1"> Larchiveum</span>
        {/* <img src={LogoCompany}/> */}
        <UIAuth/>
      </div>
      <div className="row_2">
        <div className="test">
          <div className="title_list">List tour larchiveum</div>
            <div className="col">
              {renderExhibitions()}
            </div>
            <div className=''>
              {exhibitionsLoaded ? (exhibitions.data.length > 0 ? <Pagination pagination={exhibitions.pagination} callFetchList={changePages} /> : null) : null}
            </div>
          </div>
        </div>
    </>
  );
}

ReactDOM.render(<Root />, document.getElementById("home-root"));
