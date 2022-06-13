import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import "../../react-components/styles/global.scss";
import "../../assets/larchiveum/manager.scss";
import "../../assets/larchiveum/loading.scss";
import Store from "../../utilities/store";
import ExhibitionsService from "../../utilities/apiServices/ExhibitionsService";
import MediaService from "../../utilities/apiServices/MediaService";
import ProjectService from "../../utilities/apiServices/ProjectService";
import Popup from "../../react-components/popup/popup";
import AddIcon from "../../assets/larchiveum/add_black_24dp.svg";
import Moment from "react-moment";
import "reactjs-popup/dist/index.css";
import * as moment from "moment";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import defaultImage from "../../assets/larchiveum/default-image.png";
import defaultModel from "../../assets/larchiveum/model-default.png";
import defaultImage1 from "../../assets/larchiveum/siri.gif";
import Pagination from "../../react-components/pagination/pagination";
import { APP_ROOT } from "../../utilities/constants";
import { FaUserFriends, FaRegCalendarAlt, FaLink, FaTools ,FaVideo,FaRegImage,FaCodepen,FaListOl} from "react-icons/fa";
import { Manager } from "react-popper-2";
import StoreHub from "../../storage/store";
import UserService from "../../utilities/apiServices/UserService";
import e from "cors";
import { counter } from "@fortawesome/fontawesome-svg-core";
import { object } from "prop-types";

const store = new StoreHub();

registerTelemetry("/manager", "Hubs Home Page");

export function ManagerPage() {
  return <ManagerHome />;
}

function ManagerHome() {
  toast.configure();
  const [scenes, setScenes] = useState([]);
  const [exhibitionsLoaded, setExhibitionsLoaded] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(true);
  const [objectLoaded, setObjectLoaded] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [iconLoaded, setIconLoaded] = useState(false);
  const [isOpenExhibition, setIsOpenExhibition] = useState(false);
  const [isCloseRoom, setIsCloseRoom] = useState(false);
  const [isOpenRoom, setIsOpenRoom] = useState(false);
  const [isOpenMedia, setIsOpenMedia] = useState(false);
  const [isOpenObject, setIsOpenObject] = useState(false);
  const [isDeleteRoom, setIsDeleteRoom] = useState(false);
  const [isOpenToggle, setIsOpenToggle] = useState(false);
  const [isOpenSpoke, setIsOpenSpoke] = useState(false);
  const [exhibition, setExhibition] = useState(undefined);
  const [exhibitionType, setExhibitionType] = useState("create");
  const [exhibitionId, setExhibitionId] = useState(undefined);
  const [projectId, setProjectId] = useState(undefined);
  const [isLoadingF, setIsLoadingF] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isListRoom, setIsListRoom] = useState(true);
  const [isListProject, setIsListProject] = useState(false);

  const [exhibitions, setExhibitions] = useState({
    data: [],
    pagination: {}
  });

  const [projects, setProjects] = useState({
    data: [],
    pagination: {}
  });

  const [medias, setMedias] = useState({
    data: [],
    pagination: {}
  });

  const [objects, setObjects] = useState({
    data: [],
    pagination: {}
  });

  const [filterExhibitionList, setfilterExhibitionList] = useState({
    page: 1,
    pageSize: 4,
    sort: "id|desc" //format <attribute>|<order type>
  });

  const [filterProjectList, setfilterProjectList] = useState({
    page: 1,
    pageSize: 4,
    sort: "id|desc" //format <attribute>|<order type>
  });

  function auth() {
    const user = Store.getUser();
    return UserService.checkToken(user?.token)
      .then(res => {
        if (res.result == "ok") {
          if (res.data.id != user?.id) {
            Store.removeUser();
          }
          setIsLoading(false);
          setIsLoadingF(false);
        } else {
          setIsLoading(false);
          setIsLoadingF(false);
        }
      })
      .catch(() => {
        setIsLoading(false);
        setIsLoadingF(false);
      });
  }
  useEffect(
    () => {
      auth();
      getAllExhibitions();
    },
    [filterExhibitionList.page]
  );

  useEffect(
    () => {
      const user = Store.getUser();
      if (user?.type == 5) {
        getAllProjects();
      }
    },
    [filterProjectList.page]
  );

  const getAllExhibitions = () => {
    const user = Store.getUser();
    var data = filterExhibitionList;
    if (user) {
      ExhibitionsService.getAllWithAuthExhibitions(data).then(res => {
        if (res.result == "ok") {
          setExhibitions(res.data);
          setExhibitionsLoaded(true);
          setIsLoading(false);
          setIsLoadingF(false);
        } else if (res.result == "fail" && res.error == "get_exhibitions_fail") {
          toast.error("Get Exhibitions fail !", { autoClose: 1000 });
          setIsLoading(false);
          setIsLoadingF(false);
        }
      });
      ExhibitionsService.getAllScenes().then(res => {
        if (res.result == "ok") {
          setScenes(res.data);
        } else if (res.result == "fail" && res.error == "get_exhibitions_fail") {
          toast.error("Get Exhibitions fail !", { autoClose: 1000 });
        }
      });
    }
  };

  const getAllProjects = () => {
    const Auth = Store.getUser();
    var data = filterProjectList;
    if (Auth) {
      ProjectService.getListProjectWithObjects(data).then(res => {
        if (res.result == "ok") {
          setProjects(res.data);
          setProjectsLoaded(true);
          setIsLoading(false);
        } else if (res.result == "fail") {
          toast.error("Get Projects fail !", { autoClose: 1000 });
          setIsLoading(false);
        }
      });
    }
  };

  const openPopupExhibition = exhibition => {
    if (exhibition) {
      setExhibition({
        id: exhibition.id,
        name: exhibition?.room?.name,
        description: exhibition?.room?.description,
        sceneId: exhibition.sceneId,
        startDate: moment(exhibition.startDate).format("YYYY-MM-DD"),
        public: exhibition.public,
        maxSize: exhibition.maxSize
      });
    } else {
      setExhibition(null);
    }
    setIsOpenExhibition(true);
  };

  const closePopupExhibition = () => {
    setIsOpenExhibition(false);
  };

  const openPopupPublic = exhibitionId => {
    setExhibitionId(exhibitionId);
    setIsOpenToggle(true);
  };

  const closePopupPublic = () => {
    setIsOpenToggle(false);
  };

  // const openPopupSpoke = ProjectId => {
  //   setExhibitionId(ProjectId);
  //   setIsOpenSpoke(true);
  // };

  
  const handelSpoke = () => {
    window.open(APP_ROOT + "/spoke/projects/" + projectId , '_blank');
    setIsOpenSpoke(false);
  };

  const closePopupSpoke = () => {
    setIsOpenSpoke(false);
  };
  
  const openPopupCloseRoom = exhibitionId => {
    setExhibitionId(exhibitionId);
    setIsCloseRoom(true);
  };

  const closePopupCloseRoom = () => {
    setIsCloseRoom(false);
  };

  const openPopupOpenRoom = exhibitionId => {
    setExhibitionId(exhibitionId);
    setIsOpenRoom(true);
  };

  const closePopupOpenRoom = () => {
    setIsOpenRoom(false);
  };

  const openDeleteRoom = exhibitionId => {
    setExhibitionId(exhibitionId);
    setIsDeleteRoom(true);
  };

  const openPopupCustomMedia = exhibitionId => {
    setExhibitionId(exhibitionId);
    if (exhibitionId) {
      MediaService.getListMedia(exhibitionId).then(res => {
        if (res.result == "ok") {
          setMedias(res.data);
          setMediaLoaded(true);
        } else if (res.result == "fail" && res.error == "verify_token_fail") {
          toast.error("Invalid token !", { autoClose: 3000 });
          closePopupCustomMedia();
        }
        else if (res.result == "fail" && res.error == "wrong_exhibition") {
          toast.error("Wrong Exhibition !", { autoClose: 3000 });
          closePopupCustomMedia();
        }
       else if (res.result == "fail" && res.error == "get_list_object_fail") {
          toast.error("Get List Object fail !", { autoClose: 3000 });
          closePopupCustomMedia();
        }
      });
    }
    setIsOpenMedia(true);
  };

  const closePopupCustomMedia = () => {
    setIsOpenMedia(false);
    setMedias(
      {    
        data: [],
        pagination: {}
      }
    );
  };

  const openPopupCustomObject = ProjectId => {
    if (ProjectId) {
      setProjectId(ProjectId);
      ProjectService.getListObject(ProjectId).then(res => {
        if (res.result == "ok") {
          setObjects(res.data);
          setObjectLoaded(true);
        } else if (res.result == "fail" && res.error == "verify_token_fail") {
          toast.error("Invalid token !", { autoClose: 1000 });
          closePopupCustomObject();
        }
        else if (res.result == "fail" && res.error == "wrong_exhibition") {
          toast.error("Wrong Exhibition !", { autoClose: 1000 });
          closePopupCustomObject();
        }
      });
    }
    setIsOpenObject(true);
  };

  const closePopupCustomObject = () => {
    setIsOpenObject(false);
    setObjects(
      {    
        data: [],
        pagination: {}
      }
    );
  };

  const handelSaveMediaURL = () => {
    setIconLoaded(true)
    const data = medias.data.map((item) => {
      return {
        id : item.uuid,
        url : item.url
      }
    })
    const dataString = JSON.stringify(data);
    MediaService.updateMediaMany(dataString).then(res => {
      if (res.result == "ok") {
        toast.success("update medias success ", { autoClose: 5000 });
        setIconLoaded(false);
      } else if (res.result == "fail" && res.error == "invalid_list_media") {
        toast.error("format of list media is incorrect ", { autoClose: 5000 });
      }
      else if (res.result == "fail" && res.error == "verify_token_fail") {
        toast.error("Wrong token !", { autoClose: 5000 });
      }
    });
  }

  const handelOpenSpoke =()=>{
    setIconLoaded(true);
    let list_uuid = [];
     list_uuid = objects.data.map((item) => {
      if(item?.changeable == true)
      {
        return (item.uuid)
      }
      return false;
    })
    const dataString = JSON.stringify(list_uuid);
    console.log(projectId)
    ProjectService.updateChangeableObjects( projectId, dataString).then(res => {
      if (res.result == "ok") {
        setIconLoaded(false);
        closePopupCustomObject();
        setIsOpenSpoke(true);
      } else if (res.result == "fail" && res.error == "invalid_list_changeable_object_uuid") {
        toast.error("List changeable object uuid incorrect", { autoClose: 5000 });
      }
      else if (res.result == "fail" && res.error == "verify_token_fail") {
        toast.error("Wrong token !", { autoClose: 5000 });
      }
    });

  }

  const deleteRoom = () => {
    setIsDeleteRoom(false);
  };

  const ActionListRoom = () => {
    setIsLoading(true);
    getAllExhibitions();
    setIsListRoom(true);
    setIsListProject(false);
  };

  const ActionListProject = () => {
    setIsLoading(true);
    getAllProjects();
    setIsListRoom(false);
    setIsListProject(true);
  };

  const changePages = page => {
    setIsLoading(true);
    setfilterExhibitionList({
      ...filterExhibitionList,
      page
    });
  };

  const changePagesProject = page => {
    setIsLoading(true);
    setfilterProjectList({
      ...filterProjectList,
      page
    });
  };

  const handleChange = evt => {
    const value = evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
    setExhibition({ ...exhibition, [evt.target.name]: value });
  };

  const handleChangeable = (object,evt) => {
    if(object.changeable == true)
    {
      object.changeable = false;
    }
    else
    {
      object.changeable = true;
    }
    setObjects({...objects});
  };

  const handleChangeURL = (media , evt) => {
    const value = evt.target.value;
    media.url = value;
    media.check = "checking";
    setMedias({...medias});
    fetch(media.url).then(response => {
      const contentType = response.headers.get("content-type");
      const type = contentType.split("/")[0];
      if(media.type.includes(type))
      {
        media.check = "ok"
      }
      else{
        media.check = "fail"
      }
      setMedias({...medias});
    }).catch((error) => {
        media.check = "fail";
        setMedias({...medias});
      });

  }

  const getSceneThumnail = sceneId => {
    let thumbnailUrl = null;
    for (const scene of scenes) {
      if (scene.id === sceneId) {
        thumbnailUrl = scene.thumbnailUrl;
        break;
      } else if (sceneId === undefined) {
        thumbnailUrl = defaultImage;
      }
    }
    return thumbnailUrl;
  };

  const ListScenes = () => {
    const handleChangeSceneThubmnail = e => {
      for (const scene of scenes) {
        if (scene.id === e.target.value) {

          setExhibition({ ...exhibition, [e.target.name]: e.target.value });
        }
      }
    };

    return (
      <>
        <div className="wrap-input100 validate-input">
          <select
            id="sceneSelection"
            className="input100"
            name="sceneId"
            value={exhibition ? exhibition.sceneId : undefined}
            onChange={handleChangeSceneThubmnail}
          >
            <option>---Choose Scene---</option>
            {scenes.map((item, index) => {
              return (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              );
            })}
          </select>
          <span className="focus-input100" />
        </div>
        <div className="p-t-13 p-b-9">
          <span className="txt1">Scene Thubmnail</span>
        </div>
        <img className="f-image-thumbnail" src={getSceneThumnail(exhibition ? exhibition.sceneId : undefined)} alt="" />
      </>
    );
  };

  const handleCreate = () => {
    const data = exhibition;
    ExhibitionsService.postCreateOne(data).then(res => {
      if (res.result == "ok") {
        toast.success("Create new tour success !", { autoClose: 5000 });
        setIsOpenExhibition(false);
        // setExhibitions([...exhibitions, res.data]);
        window.location.reload();
      } else if (res.result == "fail" && res.error == "verify_token_fail") {
        toast.error("You do not have permission to change or create !", { autoClose: 5000 });
      } else if (res.result == "fail" && res.error == "create_exhibition_error") {
        toast.error("The number of people in 1 room exceeds the allowed limit of 50 people !", { autoClose: 5000 });
      } else if (res.result == "fail" && res.error == "invalid_name") {
        toast.error("name should be length 4-255 !", { autoClose: 5000 });
      } else if (res.result == "fail" && res.error == "invalid_maxSize") {
        toast.error("the number of people in the room cannot be less than 1 !", { autoClose: 5000 });
      } else if (res.result == "fail" && res.error == "invalid_startDate") {
        toast.error("You must select the start date !", { autoClose: 5000 });
      } else {
        toast.error("System error Please try again later !", { autoClose: 5000 });
      }
    });
  };

  const handleEdit = () => {
    const data = exhibition;
    ExhibitionsService.putUpdateOne(data).then(res => {
      if (res.result == "ok") {
        exhibitions.data.forEach(exhibition => {
          if (exhibition.id == res.data.id) {
            toast.success("Edit Exhibition success !", { autoClose: 5000 });
            setIsOpenExhibition(false);
            getAllExhibitions();
          }
        });
      } else if (res.result == "fail" && res.error == "verify_token_fail") {
        toast.error("You do not have permission to change or create !", { autoClose: 5000 });
      } else if (res.result == "fail" && res.error == "create_exhibition_error") {
        toast.error("The number of people in 1 room exceeds the allowed limit of 50 people!", { autoClose: 5000 });
      } else if (res.result == "fail" && res.error == "invalid_name") {
        toast.error("name should be length 4-255 !", { autoClose: 5000 });
      } else if (res.result == "fail" && res.error == "invalid_maxSize") {
        toast.error("the number of people in the room cannot be less than 1 !", { autoClose: 5000 });
      } else if (res.result == "fail" && res.error == "invalid_startDate") {
        toast.error("You must select the start date !", { autoClose: 5000 });
      } else {
        toast.error("System error Please try again later !", { autoClose: 5000 });
      }
    });
  };

  const handelTogglePublic = exhibitionId => {
    ExhibitionsService.patchTogglePublic(exhibitionId).then(res => {
      if (res.result == "ok") {
        exhibitions.data.forEach(exhibition => {
          if (exhibition.id == exhibitionId) {
            exhibition.public = res.data.public;
            toast.success("Change status success !", { autoClose: 5000 });
          }
        });
        setIsOpenToggle(!isOpenToggle);
      } else if (res.result == "fail" && res.error == "invalid_id") {
        toast.error("exhibition id is incorrect !", { autoClose: 5000 });
      } else {
        toast.error("System error Please try again later !", { autoClose: 5000 });
      }
    });
  };

  const handelToggleDeleteRoom = exhibitionId => {
    ExhibitionsService.deleteOneExhibition(exhibitionId).then(res => {
      if (res.result == "ok") {
        toast.success("Delete success !", { autoClose: 5000 });
        setIsDeleteRoom(!isDeleteRoom);
        getAllExhibitions();
      } else if (res.result == "fail" && res.error == "wrong_exhibition") {
        toast.error("exhibition id is incorrect !", { autoClose: 5000 });
      } else {
        toast.error("System error Please try again later !", { autoClose: 5000 });
      }
    });
  };

  const handelCloseRoom = exhibitionId => {
    ExhibitionsService.closeOneExhibition(exhibitionId).then(res => {
      if (res.result == "ok") {
        exhibitions.data.forEach(exhibition => {
          if (exhibition.id == exhibitionId) {
            exhibition.closed = res.data.closed;
            toast.success("Change status success !", { autoClose: 5000 });
          }
        });
        setIsCloseRoom(!isCloseRoom);
      } else if (res.result == "fail" && res.error == "wrong_exhibition") {
        toast.error("exhibition id is incorrect !", { autoClose: 5000 });
      } else {
        toast.error("System error Please try again later !", { autoClose: 5000 });
      }
    });
  };

  const handelOpenRoom = exhibitionId => {
    ExhibitionsService.openOneExhibition(exhibitionId).then(res => {
      if (res.result == "ok") {
        exhibitions.data.forEach(exhibition => {
          if (exhibition.id == exhibitionId) {
            exhibition.closed = res.data.closed;
            toast.success("Change status success !", { autoClose: 5000 });
          }
        });
        setIsOpenRoom(!isOpenRoom);
      } else if (res.result == "fail" && res.error == "wrong_exhibition") {
        toast.error("exhibition id is incorrect !", { autoClose: 5000 });
      } else {
        toast.error("System error Please try again later !", { autoClose: 5000 });
      }
    });
  };

  const renderListMedia = () => {
    return (
      <>
        {mediaLoaded ? (
          <>
            {medias.data.map((item, index) => {
              if(item)
              {
                const Thubmnail  = () => {
                  if(item.type == 'video')          
                  {
                    return(
                      <>
                        <video src={item?.url}></video>
                      </>
                    )
                  }
                  else if(item.type == 'image')
                  {
                    return(
                      <>
                        <img
                          src={item?.url}
                        />
                      </>
                    )
                  }
                  else
                  {
                    return(
                      <>
                       
                      </>
                    )
                  }
                }
                const icon_type = () => {

                if(item.type == 'video')          
                  {
                    return(
                      <FaVideo className="icon_type"/>
                    )
                  }
                  else if(item.type == 'image')
                  {
                    return(
                      <FaRegImage className="icon_type"/>
                    )
                  }
                }
                
                return (
                  <div key={index}  className="items">
                    <div className="w-30">
                      {Thubmnail()}
                    </div>
                    <div className="w-70">
                      <h3 className="mb-3">{item?.name}</h3>
                      {icon_type()}
                      <div className="wrap-input100 validate-input">
                        <input className="input100" type="text" name="src" placeholder="URL" onChange={(e) => handleChangeURL(item, e)} value={item?.url}/>
                        <span className="focus-input100"/>
                      </div>
                      {item?.check != "cheking" ? "" :
                        <span>Checking the url</span>
                      }
                      {item?.check != "fail" ? "" :
                        <span>The URL is not correct</span>
                      }
                    </div>
                  </div>
                )
              }
            })}
          </>
             ) : (
          <></>
        )}
      </>
  )};

  const renderListObject = () => {
    return (
      <>
        {objectLoaded ? (
          <>

            {objects.data.map((item, index) => {
              if(item)
              {
                const Thubmnail  = () => {
                  if(item.type == 'video')          
                  {
                    return(
                      <>
                        <video src={item?.src}></video>
                      </>
                    )
                  }
                  else if(item.type == 'image')
                  {
                    return(
                      <>
                        <img
                          src={item?.src}
                        />
                      </>
                    )
                  }
                  else
                  {
                    return(
                      <>
                        <model-viewer poster={defaultModel} src={item?.src}></model-viewer>
                      </>
                    )
                  }
                }
                if((item?.changeable)==undefined)
                {
                  if(item.src.includes(item.uuid))
                  {
                    item.changeable = true
                  }
                  else{
                    item.changeable = false
                  }
                }
                const icon_type = () => {

                if(item.type == 'video')          
                  {
                    return(
                      <FaVideo className="icon_type"/>
                    )
                  }
                  else if(item.type == 'image')
                  {
                    return(
                      <FaRegImage className="icon_type"/>
                    )
                  }
                  else
                  {
                    return(
                      <FaCodepen className="icon_type"/>
                    )
                  }
                }
                return (
                  <div key={index}  className="items list_obj">
                    <div className="w-30">
                      {Thubmnail()}
                    </div>
                    <div className="w-70">
                      <h3 className="mb-3">{item?.name}</h3>
                      {icon_type()}
                      <label className="checkbox_Url_change">
                        <input
                          className="largerCheckbox"
                          type="checkbox"
                          name="public"
                          checked={item?.changeable}
                          onChange={(e) => handleChangeable(item, e)}
                        />
                        <span className="textCheckbox">URL Changeable</span>
                      </label>
          
                    </div>
                  </div>
                )
              }
            })}
          </>
             ) : (
          <></>
        )}
      </>
  )};

  const renderTabs = () => {
    const user = Store.getUser();
      if (user?.type == 5) {
        return (
        <div className="tabs-Admin">
          <button className={isListRoom ? "active" : ""} onClick={ActionListRoom} >LIST ROOM</button>  
          <button className={isListProject ? "active" : ""} onClick={ActionListProject}>PROJECT</button>  
        </div>
        );
      }
  };

  const renderExhibitions = () => {
    return (
      <>
        {exhibitionsLoaded ? (
          <>
            List Tour Larchiveum
            <button
                className="btn btn-create"
                onClick={() => {
                  openPopupExhibition(), setExhibitionType("create");
                }}
              >
              <img src={AddIcon} />
            </button>
            {exhibitions.data.map((item, index) => {
              const PublishButton = () => {
                if (item.public == 1) {
                  return (
                    <button
                      className="btn btn-unpublish"
                      onClick={() => {
                        openPopupPublic(item.id);
                      }}
                      data-id-exhibition={item.id}
                    >
                      Private
                    </button>
                  );
                } else {
                  return (
                    <button
                      className="btn btn-publish"
                      onClick={() => {
                        openPopupPublic(item.id);
                      }}
                      data-id-exhibition={item.id}
                    >
                      Public
                    </button>
                  );
                }
              };

              const ClosedButton = () => {
                if (item.closed == 1) {
                  return (
                    <button
                      className="btn btn-open"
                      onClick={() => {
                        openPopupOpenRoom(item.id);
                      }}
                      data-id-exhibition={item.id}
                    >
                      Open Room
                    </button>
                  );
                } else {
                  return (
                    <button
                      className="btn btn-close"
                      onClick={() => {
                        openPopupCloseRoom(item.id);
                      }}
                      data-id-exhibition={item.id}
                    >
                      Close room
                    </button>
                  );
                }
              };

              if (item.room) {
                return (
                <>
                  <div key={index} className={"items"}>
                    <span className="name-tour">{item.name}</span>
                    <img src={getSceneThumnail(item ? item.sceneId : undefined)} alt="" />
                    <FaTools
                      className="icon_edit_media"
                      onClick={() => {
                        openPopupCustomMedia(item.id);
                      }}
                      data-id-exhibition={item.id}
                    />
                    <div className="content">
                      <div>
                        <span className="text-bold">{item?.room?.name}</span>
                      </div>
                      <div className="d-flex">
                        <FaLink className="IconFa" /> :{" "}
                        <span className="ml-1">
                          <a href={APP_ROOT + "/" + item.roomId} target="_blank">
                            {APP_ROOT + "/" + item.roomId}
                          </a>
                        </span>
                      </div>
                      <div className="d-flex">
                        <FaUserFriends className="IconFa" /> :{" "}
                        <span className="ml-1">
                          {" "}
                          {item.reservationCount}/{item.maxSize}
                        </span>
                      </div>
                      <div>
                        <div className="d-flex">
                          <FaRegCalendarAlt className="IconFa" /> :
                          <span className="ml-1">
                            <Moment format="YYYY-MM-DD">{item.startDate}</Moment>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="btn-action">
                      <PublishButton />
                      <button
                        className="btn btn-edit"
                        onClick={() => {
                          openPopupExhibition(item), setExhibitionType("edit");
                        }}
                        data-id-exhibition={item.id}
                      >
                        Edit
                      </button>
                      <ClosedButton />
                    </div>
                  </div>
                </>

                );
              } else {
                return (
                  <div key={index}  className={"items"}>
                    <span className="name-tour">This room is currently unavailable</span>
                    <img src={defaultImage1} alt="" />
                    <div className="content">
                      <div>
                        <span className="text-bold">This room is currently unavailable</span>
                      </div>
                      <div className="d-flex">
                        <FaLink className="IconFa" /> :{" "}
                        <span className="ml-1">
                          <a href="#" target="_blank">
                            NAN
                          </a>
                        </span>
                      </div>
                      <div className="d-flex">
                        <FaUserFriends className="IconFa" /> : <span className="ml-1">NAN/NAN</span>
                      </div>
                      <div>
                        <div className="d-flex">
                          <FaRegCalendarAlt className="IconFa" /> :
                          <span className="ml-1">
                            <Moment format="YYYY-MM-DD">{item.startDate}</Moment>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="btn-action">
                      <button
                        className="btn btn-delete"
                        onClick={() => {
                          openDeleteRoom(item.id);
                        }}
                        data-id-exhibition={item.id}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              }
            })
            }
          </>
        ) : (
          <></>
        )}
        {exhibitionsLoaded ? (
            exhibitions.data.length > 0 ? (
              <Pagination pagination={exhibitions.pagination} callFetchList={changePages} />
            ) : null
          ) : null}
      </>
    );
  };

  const renderProjects = () => {
    return (
      <>
        {projectsLoaded ? (
          <>
            List Project Larchiveum
            {projects.data.map((item, index) => {
              let count_Image=0;
              let count_Video=0;
              let count_Model=0;
              item?.objects.filter(item => item.type === 'image').map(item => {
                  count_Image++;
              })
              item?.objects.filter(item => item.type === 'video').map(item => {
                  count_Video++;
              })
              item?.objects.filter(item => item.type.includes('model')).map(item => {
                  count_Model++;
              })
              return(
                <div key={item.id} className={"items"}>
                  <span className="name-tour">{item?.name}</span>
                  <img src={item?.thumbnail_url} alt="" />
                  <div className="content">
                    <div>
                      <span className="text-bold">{item?.name}</span>
                      <div className="d-flex-icon">
                        <span>{count_Image}<FaVideo className="icon"/></span>
                        <span>{count_Video}<FaRegImage className="icon"/></span>
                        <span>{count_Model}<FaCodepen className="icon"/></span>
                      </div>
                    </div>
                  </div>
                  <div className="btn-action">
                    <FaListOl className="btn-list-object" onClick={() => {  openPopupCustomObject(item.id);}}/>
                  </div>
                </div>
              )
            })}
          </>

        ) : (
          <></>
        )}
          {projectsLoaded ? (
            projects.data.length > 0 ? (
              <Pagination pagination={projects.pagination} callFetchList={changePagesProject} />
            ) : null
          ) : null}
      </>
    );
  };

  const AccountPermision = () => {
    const user = Store.getUser();
    if (user?.type >= 3) {
      return (
        <div className="title">
          <div className="col">
            {isListRoom && (
              renderExhibitions()
            )}
            {isListProject && (
              renderProjects()
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="title">
          <div className="title_access_err">
            You do not have access <br /> Please login with an account manager to use this service
          </div>
        </div>
      );
    }
  };

  const IAuth = () => {
    const user = Store.getUser();
    const MasterAdmin = () => {
      if (user?.type == 5) {
        return (
          <>
            <a className="gotospoke" href={APP_ROOT + "/spoke"}>
              {" "}
              Spoke{" "}
            </a>
            <a className="gotoadmin" href={APP_ROOT + "/admin"}>
              {" "}
              Admin{" "}
            </a>
          </>
        );
      } else {
        return <></>;
      }
    };
    if (user) {
      return (
        <span className="display-name">
          <MasterAdmin />
          <span className="nameA">{user.displayName || user.email}</span> |{" "}
          <a className="gotohome" href="/">
            {" "}
            Home
          </a>
        </span>
      );
    } else {
      return <></>;
    }
  };

  if (isLoadingF) {
    return (
      <div className="loader-2">
        <div className="loader">
            <svg viewBox="0 0 80 80">
                <circle id="test" cx="40" cy="40" r="32"></circle>
            </svg>
        </div>
        <div className="loader triangle">
            <svg viewBox="0 0 86 80">
                <polygon points="43 8 79 72 7 72"></polygon>
            </svg>
        </div>
        <div className="loader">
            <svg viewBox="0 0 80 80">
                <rect x="8" y="8" width="64" height="64"></rect>
            </svg>
        </div>
      </div>
    );
  } else {
    if (isLoading) {
      return (
        <div className="loader-1">
          <div className="loader triangle">
              <svg viewBox="0 0 86 80">
                  <polygon points="43 8 79 72 7 72"></polygon>
              </svg>
          </div>
        </div>
      );
    } 
    else{
      return (
        <>
          {isOpenExhibition && (
            <Popup
              size={"xl"}
              title={exhibitionType == "edit" ? <>Edit Exhibition </> : <> Create Exhibition</>}
              content={
                <>
                  <form className="create100-form validate-form d-flex" name="form">
                    <div className="w-60">
                      <div className="p-t-13 p-b-9">
                        <span className="txt1">Name Exhibition</span>
                      </div>
                      <div className="wrap-input100 validate-input">
                        <input
                          className="input100"
                          type="text"
                          name="name"
                          value={exhibition ? exhibition.name : undefined}
                          onChange={handleChange}
                          placeholder="Name Tour"
                        />
                        <span className="focus-input100" />
                      </div>
                      <div className="p-t-13 p-b-9">
                        <span className="txt1">Description</span>
                      </div>
                      <div className="wrap-input100 validate-input">
                        <textarea
                          className="textarea100"
                          name="description"
                          value={exhibition ? exhibition.description : undefined}
                          onChange={handleChange}
                          placeholder="Description about tour"
                          rows="10"
                        />
                        <span className="focus-input100" />
                      </div>
                      <div className="p-t-13 p-b-9">
                        <span className="txt1">Public</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          name="public"
                          checked={exhibition ? exhibition.public : undefined}
                          onChange={handleChange}
                        />
                        <span className="slider" />
                      </label>
                    </div>
                    <div className="w-40">
                      <div className="d-flex-form">
                        <div className="item-input">
                          <div className="p-t-13 p-b-9">
                            <span className="txt1">Max Size</span>
                          </div>
                          <div className="wrap-input100 validate-input">
                            <input
                              className="input100"
                              type="number"
                              min={0}
                              max={50}
                              name="maxSize"
                              value={exhibition ? exhibition.maxSize : 1}
                              onChange={handleChange}
                            />
                            <span className="focus-input100" />
                          </div>
                        </div>
                        <div className="item-input">
                          <div className="p-t-13 p-b-9">
                            <span className="txt1">Start day</span>
                          </div>
                          <div className="wrap-input100 validate-input">
                            <input
                              className="input100"
                              type="date"
                              name="startDate"
                              placeholder="dd-mm-yyyy"
                              value={exhibition ? exhibition.startDate : undefined}
                              onChange={handleChange}
                            />
                            <span className="focus-input100" />
                          </div>
                        </div>
                      </div>
                      <div className="p-t-13 p-b-9">
                        <span className="txt1">List Scene</span>
                      </div>
                      <ListScenes />
                    </div>
                  </form>
                </>
              }
              actions={[
                {
                  text: exhibitionType == "edit" ? "Edit" : "Create",
                  class: "btn-handle",
                  callback: () => {
                    exhibitionType == "edit" ? handleEdit() : handleCreate();
                  }
                },
                {
                  text: "Cancel",
                  class: "btn-cancle",
                  callback: () => {
                    closePopupExhibition();
                  }
                }
              ]}
              handleClose={() => {
                closePopupExhibition();
              }}
            />
          )}
  
          {isOpenToggle && (
            <Popup
              title={<>Change public status</>}
              size={"sm"}
              content={
                <>
                  <br />
                  Are you sure Change this public status ?
                  <br />
                  <br />
                </>
              }
              actions={[
                {
                  text: "Change",
                  class: "btn1",
                  callback: () => {
                    handelTogglePublic(exhibitionId);
                  }
                },
                {
                  text: "Cancel",
                  class: "btn2",
                  callback: () => {
                    closePopupPublic();
                  }
                }
              ]}
              handleClose={closePopupPublic}
            />
          )}
  
          {isOpenSpoke && (
            <Popup
              title={<>Go to page Spoke</>}
              size={"sm"}
              content={
                <>
                  To continue the process, follow these steps:
                  <ul>
                    <li>- Go to spoke using the "Goto Spoke" button below </li>
                    <li>- Click "Publish Scene" button on top toolbar</li>
                    <li>- After the popup opens, select "Save Project"</li>
                    <li>- After the popup opens, select "Save and Publish"</li>
                    <li>- Finally, select "Save Scene" to finish</li>
                  </ul>
                </>
              }
              actions={[
                {
                  text: "Goto Spoke",
                  class: "btn1",
                  callback: () => {
                    handelSpoke(projectId);
                  }
                },
                {
                  text: "Cancel",
                  class: "btn2",
                  callback: () => {
                    closePopupSpoke();
                  }
                }
              ]}
              handleClose={closePopupSpoke}
            />
          )}    
  
          {isCloseRoom && (
            <Popup
              title={<>Close room</>}
              size={"sm"}
              content={
                <>
                  <br />
                  Are you sure to close this room? People will not be able to access when you close the room ?
                  <br />
                  <br />
                </>
              }
              actions={[
                {
                  text: "Close Room",
                  class: "btn1",
                  callback: () => {
                    handelCloseRoom(exhibitionId);
                  }
                },
                {
                  text: "Cancel",
                  class: "btn2",
                  callback: () => {
                    closePopupCloseRoom();
                  }
                }
              ]}
              handleClose={closePopupCloseRoom}
            />
          )}
  
          {isOpenRoom && (
            <Popup
              title={<>Open room</>}
              size={"sm"}
              content={
                <>
                  <br />
                  Are you sure to open this room? People will can access to the room ?
                  <br />
                  <br />
                </>
              }
              actions={[
                {
                  text: "Open Room",
                  class: "btn1",
                  callback: () => {
                    handelOpenRoom(exhibitionId);
                  }
                },
                {
                  text: "Cancel",
                  class: "btn2",
                  callback: () => {
                    closePopupOpenRoom();
                  }
                }
              ]}
              handleClose={closePopupOpenRoom}
            />
          )}
  
          {isDeleteRoom && (
            <Popup
              title={<>Delete room</>}
              size={"sm"}
              content={
                <>
                  <br />
                  Are you sure to delete this room? People will not be able to access when you close the room ?
                  <br />
                  <br />
                </>
              }
              actions={[
                {
                  text: "Delete Room",
                  class: "btn1",
                  callback: () => {
                    handelToggleDeleteRoom(exhibitionId);
                  }
                },
                {
                  text: "Cancel",
                  class: "btn2",
                  callback: () => {
                    deleteRoom();
                  }
                }
              ]}
              handleClose={deleteRoom}
            />
          )}
  
          {isOpenMedia && (
            <Popup
              size={"xl"}
              title={"Custom Media"}
              content={
                <>
                  <form className="create100-form validate-form d-flex form-custom-media" name="form">
                    <div className="w-100">
                      <div className="p-t-13 p-b-9">
                        {renderListMedia()}
                      </div>
                    </div>
                  </form>
                </>
              }
              actions={[
                {
                  text: iconLoaded ? <div className="lds-dual-ring"></div> : <span>save</span>,
                  class: "btn-handle",
                  callback: () => {
                    handelSaveMediaURL();
                  }
                },
                {
                  text: "Cancel",
                  class: "btn-cancle",
                  callback: () => {
                    closePopupCustomMedia();
                  }
                }
              ]}
              handleClose={() => {
                closePopupCustomMedia();
              }}
            />
          )}
  
          {isOpenObject && (
            <Popup
              size={"xl"}
              title={"List Object"}
              content={
                <>
                  <form className="create100-form validate-form d-flex form-custom-media" name="form">
                    <div className="w-100">
                      <div className="p-t-13 p-b-9">
                        {renderListObject()}
                      </div>
                    </div>
                  </form>
                </>
              }
              actions={[
                {
                  text: iconLoaded ? <div className="lds-dual-ring"></div> : <span>save</span>,
                  class: "btn-handle",
                  callback: () => {
                    handelOpenSpoke();
                  }
            
                },
                {
                  text: "Cancel",
                  class: "btn-cancle",
                  callback: () => {
                    closePopupCustomObject();
                  }
                }
              ]}
              handleClose={() => {
                closePopupCustomObject();
              }}
            />
          )}
  
          <div className="manager-page">
            <div className="row_1">
              <span className="text_1">Manager Larchiveum</span>
              <IAuth />
            </div>
  
            <div className="row_2">
              {renderTabs()}
                <AccountPermision />
            </div>
          </div>
        </>
      );
    }
  }
}
