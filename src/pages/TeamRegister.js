import "./AdminRegister.css";
import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import fallbackImg from "../assets/images/football-team_16848377.png";
import NavbarComponent from "../components/Navbar";
import { api } from "../Config";
import { getImageUrl } from "../Utils/constants";
import { fetchTeamById, fetchTeams } from "./Teams/TeamData";

const TeamRegister = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const editTeamId = searchParams.get("edit");
  const isEdit = Boolean(editTeamId);

  const [formData, setFormData] = useState({
    teamName: "",
    teamRank: "",
    totalBudget: "",
    seasonBudget: "",
    playersBought: "",
    imagePath: "",
    captain: "",
    mobile: "",
    emailId: "",
    password: ""
  });

  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const loadTeamData = async () => {
      if (!isEdit) return;
      let teamData = location.state?.team;

      if (!teamData) {
        try {
          teamData = await fetchTeamById(editTeamId);
          if (!teamData) {
            const allTeams = await fetchTeams();
            teamData = allTeams.find((t) => t.team_id.toString() === editTeamId.toString());
          }
        } catch (err) {
          console.error("Failed to load team details for editing:", err);
        }
      }

      if (!ignore && teamData) {
        setFormData({
          teamName: teamData.name || teamData.teamName || "",
          teamRank: teamData.team_rank || teamData.trank || teamData.Team_Rank || "",
          totalBudget: teamData.total_budget || teamData.Total_Budget || "",
          seasonBudget: teamData.season_budget || teamData.Season_Budget || teamData.current_budget || teamData.purse || "",
          playersBought: teamData.players_bought || teamData.Players_Bought || "",
          imagePath: teamData.image_path || "",
          captain: teamData.captain || "",
          mobile: teamData.mobile_no || teamData.mobile_No || teamData.mobile || "",
          emailId: teamData.email_id || teamData.email_Id || teamData.email || "",
          password: ""
        });

        if (teamData.image_path) {
          setPreview(getImageUrl(teamData.image_path));
        }
      }
    };

    loadTeamData();
    return () => {
      ignore = true;
    };
  }, [editTeamId, isEdit, location.state]);

  const handleChange = (e) => {


    const { name, value, files } = e.target;

    if(name === "emailId"){
        setError("");
        const emailPattern= /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!value){
          setError("Please Enter Email Address");
        }else if(!emailPattern.test(value)){
          setError("Invalid Email Format");
        }
    }

    if(name === "image" && files && files[0]){
      const file = files[0];
      if(file.size > 5 * 1024 * 1024){
        alert("Image size should be less than 5MB");
        return;
      }
      if(!file.type.startsWith("image/")){
        alert("Please Upload a valid image file");
        return; 
      }
      setFormData({
        ...formData,
        image: file,
      });
      setPreview(URL.createObjectURL(file));
    } else{
    setFormData({
      ...formData,
      [name]: value,
    });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "image") {
        if (formData.image) {
          data.append("image", formData.image);
        }
      } else {
        // Skip blank password on edit so existing password isn't overwritten
        if (isEdit && key === "password" && !formData.password) {
          return;
        }
        if (formData[key] !== "" && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      }
    });

    try {
      if (isEdit) {
        const res = await api.put(
          `/team/${editTeamId}`,
          data,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        alert(res.data.message || "Team Updated Successfully");
        navigate(`/team_info/${editTeamId}`);
      } else {
        const res = await api.post(
          "/add-team",
          data,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        alert(res.data.message || "Team Added Successfully");
        navigate("/teams");
      }
    } catch (err) {
      console.log(err.response?.data);
      alert(err.response?.data?.detail || "Something Went wrong");
    }
  };
  return (
    <>
      <div className="register-bg">
        <NavbarComponent/>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger mt-0" role="alert">
              {error}
            </div>
          )}
          <div className="container player-info-container shadow p-3  rounded register-rg">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
              <h4 className="text-white m-0">
                {isEdit ? `✏️ Edit Team: ${formData.teamName || "Existing Team"}` : "Register New Team"}
              </h4>
              {isEdit && (
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm px-3"
                  onClick={() => navigate(`/team_info/${editTeamId}`)}
                >
                  ← Back to Team
                </button>
              )}
            </div>
            <div className="row g-5">
              {/* Team Image */}
              <div className="col-md-3 text-center">
                <img 
                  src={preview || fallbackImg}
                  alt={formData?.name ? `${formData.name} logo preview` : "Team logo preview"}
                  className="img-fluid rounded"
                  style={{ maxHeight: "200px", objectFit: "cover"}}
                />
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                  className="form-control mt-2"
                  aria-label="Upload Team Logo"
                />
              </div>

              {/* Team Details */}
              <div className="col-md-9 ">
                <div className="row g-3">
                  <div className="col-md-3 info-box green">
                     <label htmlFor="teamName" className="label">Team Name</label>
                     <div className="value p-1">
                       <input
                         id="teamName"
                         className="border-1"
                         placeholder="Enter Team Name"
                         type="text"
                         name="teamName"
                         value={formData.teamName}
                         onChange={handleChange}
                         required
                       ></input>
                     </div>
                  </div>

                  <div className="col-md-3 info-box green">
                     <label htmlFor="captain" className="label">Captain Name</label>
                     <div className="value p-1">
                       <input
                         id="captain"
                         className="border-1"
                         placeholder="Enter Captain Name"
                         type="text"
                         name="captain"
                         value={formData.captain}
                         onChange={handleChange}
                         required
                       ></input>
                     </div>
                  </div>
                  <div className="col-md-3 info-box green">
                     <label htmlFor="mobile" className="label">Mobile Number</label>
                     <div className="value p-1">
                       <input
                         id="mobile"
                         className="border-1"
                         placeholder="Enter Team Mobile Number"
                         type="text"
                         name="mobile"
                         value={formData.mobile}
                         onChange={handleChange}
                         required
                       ></input>
                     </div>
                  </div>
                  <div className="col-md-3 info-box green">
                     <label htmlFor="emailId" className="label">Email Address</label>
                     <div className="value p-1">
                       <input
                         id="emailId"
                         className="border-1"
                         placeholder="Enter Team Email Address"
                         type="email"
                         name="emailId"
                         value={formData.emailId}
                         onChange={handleChange}
                         required
                       ></input>
                     </div>
                  </div>

                  <div className="col-md-3 info-box green">
                     <label htmlFor="password" className="label">Login Password</label>
                     <div className="value p-1">
                       <input
                         id="password"
                         className="border-1"
                         placeholder={isEdit ? "Leave blank to keep current" : "Enter Team Password"}
                         type="password"
                         name="password"
                         value={formData.password}
                         onChange={handleChange}
                         required={!isEdit}
                       ></input>
                     </div>
                  </div>

                  {/* Stats */}
                  {/*<div className="col-md-3 stat-box orange">
                    <div className="label">Team Rank</div>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        name="teamRank"
                        placeholder="Enter Team Rank"
                        value={formData.teamRank}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>*/}
                  {/*<div className="col-md-3 stat-box orange">
                    <div className="label">Total Budget</div>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        name="totalBudget"
                        placeholder="Enter Teams total budget"
                        value={formData.totalBudget}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>*/}
                  <div className="col-md-3 stat-box orange">
                     <label htmlFor="seasonBudget" className="label">Current Season Budget</label>{/*Change to purse */}
                     <div className="value p-1">
                       <input
                         id="seasonBudget"
                         className="border-1"
                         type="number"
                         name="seasonBudget"
                         pattern="[0-9]{3}"
                         placeholder="Enter Current Season Budget"
                         value={formData.seasonBudget}
                         onChange={handleChange}
                       ></input>
                     </div>
                  </div>
                  {/*<div className="col-md-3 stat-box orange">
                    <div className="label">Players Bought</div>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        name="playersBought"
                        width="100%"
                        placeholder="Enter Total Players bought in current season"
                        value={formData.playersBought}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>*/}
                  <div className="d-flex gap-2 mt-3 w-100">
                    <button
                      className={`btn ${isEdit ? "btn-warning" : "btn-primary"} flex-grow-1 btn-c fw-bold`}
                      type="submit"
                      onClick={handleSubmit}
                    >
                      {isEdit ? "💾 Update Team Details" : "Submit form"}
                    </button>
                    {isEdit && (
                      <>
                        <button
                          type="button"
                          className="btn btn-danger btn-c fw-bold px-4"
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to delete this team? This action cannot be undone and will permanently remove their logo, login account, and auction records.")) {
                              try {
                                await api.delete(`/team/${editTeamId}`);
                                alert("Team deleted successfully");
                                navigate("/teams");
                              } catch (err) {
                                alert("Failed to delete team: " + (err.response?.data?.detail || err.message));
                              }
                            }
                          }}
                        >
                          🗑️ Delete Team
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-c fw-bold px-4"
                          onClick={() => navigate(`/team_info/${editTeamId}`)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default TeamRegister;
