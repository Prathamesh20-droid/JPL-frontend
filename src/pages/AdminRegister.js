import "./AdminRegister.css";
import { useReducer, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import fallbackImg from "../assets/images/PlAyer.png";
import NavbarComponent from "../components/Navbar";
import { api } from "../Config";
import { getImageUrl } from "../Utils/constants";

const initialState = {
  formData: {
    playerName: "",
    fatherName: "",
    surName: "",
    jerseyNo: "",
    nickName: "",
    category: "",
    style: "",
    totalRuns: "",
    highestRuns: "",
    basePrice: "",
    wickets: "",
    outs: "",
    role: "",
    mobile: "",
    emailId: "",
    age: "",
    gender: "",
    image: null,
    teams: [],
  },
  loading: true,
  teams: [],
  preview: null,
  dropdownOpen: false,
  error: "",
};

function adminRegisterReducer(state, action) {
  switch (action.type) {
    case "SET_FORM_DATA":
      return { ...state, formData: action.value };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_TEAMS":
      return { ...state, teams: action.value };
    case "SET_PREVIEW":
      return { ...state, preview: action.value };
    case "TOGGLE_DROPDOWN":
      return { ...state, dropdownOpen: !state.dropdownOpen };
    case "SET_ERROR":
      return { ...state, error: action.value };
    default:
      return state;
  }
}

const AdminRegister = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const editPlayerId = searchParams.get("edit");
  const isEdit = Boolean(editPlayerId);

  const [state, dispatch] = useReducer(adminRegisterReducer, initialState);
  const { formData, teams, preview, dropdownOpen, error } = state;

  const handleClickUpper = () => {
    dispatch({
      type: "SET_FORM_DATA",
      value: {
        ...formData,
        category: formData.category.toUpperCase(),
      },
    });
  };

  const toggleDropdown = () => dispatch({ type: "TOGGLE_DROPDOWN" });

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get("/teams");
        dispatch({ type: "SET_TEAMS", value: Array.isArray(res.data) ? res.data : [] });
      } catch (err) {
        console.error("Error fetching teams:", err);
      } finally {
        dispatch({ type: "SET_LOADING", value: false });
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadPlayerData = async () => {
      if (!isEdit) return;

      let playerData = location.state?.player;

      if (!playerData) {
        try {
          const res = await api.get(`/players/${editPlayerId}?role=player`);
          playerData = res.data?.data || res.data;
        } catch (err) {
          console.error("Failed to load player details for editing:", err);
        }
      }

      if (!ignore && playerData) {
        let pName = "";
        let fName = "";
        let sName = "";
        if (playerData.name) {
          const parts = playerData.name.trim().split(/\s+/);
          if (parts.length === 1) {
            pName = parts[0];
          } else if (parts.length === 2) {
            pName = parts[0];
            sName = parts[1];
          } else if (parts.length >= 3) {
            pName = parts[0];
            fName = parts.slice(1, -1).join(" ");
            sName = parts[parts.length - 1];
          }
        }

        let initialTeams = [];
        if (Array.isArray(playerData.teams)) {
          initialTeams = playerData.teams.map((t) => String(t.team_id || t.id || t));
        } else if (playerData.team_ids) {
          initialTeams = String(playerData.team_ids)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        } else if (typeof playerData.teams === "string" && playerData.teams.trim()) {
          initialTeams = playerData.teams
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }

        dispatch({
          type: "SET_FORM_DATA",
          value: {
            playerName: playerData.playerName || pName || "",
            fatherName: playerData.fatherName || fName || "",
            surName: playerData.surName || sName || "",
            jerseyNo: playerData.jersey ?? playerData.jerseyNo ?? "",
            nickName: playerData.nickname || playerData.nickName || "",
            category: playerData.category || "",
            style: playerData.type || playerData.style || "",
            totalRuns: playerData.total_runs ?? playerData.totalRuns ?? "",
            highestRuns: playerData.highest_runs ?? playerData.highestRuns ?? "",
            basePrice: playerData.base_price ?? playerData.basePrice ?? "",
            wickets: playerData.wickets_taken ?? playerData.wickets ?? "",
            outs: playerData.times_out ?? playerData.outs ?? "",
            role: playerData.role || playerData.type || "Player",
            mobile: playerData.mobile_no || playerData.mobile || "",
            emailId: playerData.email_id || playerData.emailId || "",
            age: playerData.age ?? "",
            gender: playerData.gender || "",
            image: null,
            teams: initialTeams,
          },
        });

        if (playerData.image_path) {
          dispatch({ type: "SET_PREVIEW", value: getImageUrl(playerData.image_path) });
        }
      }
    };

    loadPlayerData();
    return () => {
      ignore = true;
    };
  }, [editPlayerId, isEdit, location.state]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "emailId") {
      dispatch({ type: "SET_ERROR", value: "" });
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailPattern.test(value)) {
        dispatch({ type: "SET_ERROR", value: "Invalid Email Format" });
      }
    }

    if (name === "image" && files && files[0]) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file");
        return;
      }
      dispatch({
        type: "SET_FORM_DATA",
        value: {
          ...formData,
          image: file,
        },
      });
      dispatch({ type: "SET_PREVIEW", value: URL.createObjectURL(file) });
    } else {
      dispatch({
        type: "SET_FORM_DATA",
        value: {
          ...formData,
          [name]: value,
        },
      });
    }
  };

  const handleTeamCheckboxChange = (e) => {
    const { value, checked } = e.target;
    const newTeams = checked
      ? [...formData.teams, value]
      : formData.teams.filter((teamId) => teamId !== value);
    dispatch({
      type: "SET_FORM_DATA",
      value: { ...formData, teams: newTeams },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "teams") {
        if (formData.teams.length > 0) {
          formData.teams.forEach((teamId) =>
            data.append("teams", Number(teamId))
          );
        }
      } else if (key === "image") {
        if (formData.image) {
          data.append("image", formData.image);
        }
      } else {
        if (formData[key] !== "" && formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      }
    });

    try {
      if (isEdit) {
        const res = await api.put(`/players/${editPlayerId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        alert(res.data?.message || "Player Updated Successfully");
        navigate(`/player_info/${editPlayerId}`);
      } else {
        const res = await api.post("/add-player", data, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        alert(res.data?.message || "Player Added Successfully");
        navigate("/players");
      }
    } catch (err) {
      console.error(err.response?.data);
      let errMsg = err.response?.data?.detail || err.response?.data?.error || "Something Went Wrong";
      if (Array.isArray(errMsg)) {
        errMsg = errMsg.map(e => `${e.loc?.join(".")}: ${e.msg}`).join("\n");
      }
      alert(errMsg);
    }
  };

  return (
    <>
      <div className="register-bg">
        <NavbarComponent />
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger mt-0" role="alert">
              {error}
            </div>
          )}
          <div className="container player-info-container1 shadow p-3 rounded register-rg">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
              <h4 className="text-white m-0">
                {isEdit
                  ? `✏️ Edit Player: ${[formData.playerName, formData.surName].filter(Boolean).join(" ") || "Existing Player"}`
                  : "Register New Player"}
              </h4>
              {isEdit && (
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm px-3"
                  onClick={() => navigate(`/player_info/${editPlayerId}`)}
                >
                  ← Back to Player
                </button>
              )}
            </div>
            <div className="row g-5">
              {/* Player Image */}
              <div className="col-md-3 text-center">
                <img
                  src={preview || fallbackImg}
                  alt={formData?.name ? `${formData.name} photo preview` : "Player photo preview"}
                  className="img-fluid rounded"
                  style={{ maxHeight: "200px", objectFit: "cover" }}
                />
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                  className="form-control mt-2"
                  id="playerImage"
                  aria-label="Upload Player Photo"
                />
              </div>

              {/* Team Details */}
              <div className="col-md-9 ">
                <div className="row g-3">
                  <div className="col-md-3 info-box green">
                    <label className="label" htmlFor="playerName">Player Name</label>
                    <div className="value p-1">
                      <input
                        className="border-1"
                        placeholder="Enter Player Name"
                        type="text"
                        name="playerName"
                        id="playerName"
                        value={formData.playerName}
                        onChange={handleChange}
                        required
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box green">
                    <label className="label" htmlFor="fatherName">Father Name</label>
                    <div className="value p-1">
                      <input
                        className="border-1"
                        placeholder="Enter father name"
                        type="text"
                        name="fatherName"
                        id="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box green">
                    <label className="label" htmlFor="surName">Surname</label>
                    <div className="value p-1">
                      <input
                        className="border-1"
                        placeholder="Enter Surname"
                        type="text"
                        name="surName"
                        id="surName"
                        value={formData.surName}
                        onChange={handleChange}
                        required
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box green">
                    <label className="label" htmlFor="gender">Gender</label>
                    <div className="value p-1">
                      <select
                        className="form-select border-1 border-black"
                        name="gender"
                        id="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-3 info-box green">
                    <label className="label" htmlFor="jerseyNo">Jersey No</label>
                    <div className="value p-1">
                      <input
                        className="border-1"
                        placeholder="Enter Jersey Number"
                        type="number"
                        min="0"
                        name="jerseyNo"
                        id="jerseyNo"
                        value={formData.jerseyNo}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box green">
                    <label className="label" htmlFor="nickName">Nick Name</label>
                    <div className="value p-1">
                      <input
                        className="border-1"
                        type="text"
                        placeholder="Enter Nick Name"
                        name="nickName"
                        id="nickName"
                        value={formData.nickName}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box green">
                    <label className="label" htmlFor="mobile">Mobile Number</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        placeholder="Enter Mobile Number without +91"
                        name="mobile"
                        id="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box green">
                    <label className="label" htmlFor="age">Age</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        placeholder="Enter age of player"
                        name="age"
                        id="age"
                        min="1"
                        max="99"
                        value={formData.age}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box green">
                    <label className="label" htmlFor="emailId">Email</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="email"
                        placeholder="Enter Email Address"
                        name="emailId"
                        id="emailId"
                        value={formData.emailId}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box red">
                    <label className="label" htmlFor="role">Role</label>
                    <div className="value p-1">
                      <input
                        className="border-1"
                        placeholder="Enter Role of player"
                        type="text"
                        name="role"
                        id="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box red">
                    <label className="label" htmlFor="category">Player Category</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph"
                        type="text"
                        name="category"
                        id="category"
                        maxLength="2"
                        placeholder="Enter Category (A,B,C,D...)"
                        value={formData.category}
                        onChange={handleChange}
                        onInput={handleClickUpper}
                        required
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 info-box red">
                    <label className="label" htmlFor="style">Style</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="text"
                        name="style"
                        id="style"
                        placeholder="Playing style (e.g. Right Hand Spinner)"
                        value={formData.style}
                        onChange={handleChange}
                        required
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-6 info-box red">
                    <label className="label" htmlFor="basePrice">Base Price</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        min="0"
                        name="basePrice"
                        id="basePrice"
                        placeholder="Enter Base Price (in INR ₹)"
                        value={formData.basePrice}
                        onChange={handleChange}
                        required
                      ></input>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="col-md-6 team-box">
                    <div className="label bg-primary text-white p-2 rounded mb-2">
                      Played for Teams
                    </div>

                    <div className="dropdown dropup">
                      <button
                        className="btn btn-outline-primary dropdown-toggle"
                        type="button"
                        onClick={toggleDropdown}
                        aria-expanded={dropdownOpen}
                      >
                        {formData.teams.length === 0
                          ? "Select Teams"
                          : formData.teams
                            .map(
                              (teamId) => 
                                teams.find((t) => t.team_id === parseInt(teamId))?.name
                            )
                            .join(", ")}
                      </button>
                      <ul
                        className={`dropdown-menu p-2 custom-dropdown-menu${
                          dropdownOpen ? " show" : ""
                        }`}
                      >
                        {(Array.isArray(teams) ? teams : []).map((team) => (
                          <li key={team.team_id || team.id}>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`team-${team.team_id}`}
                                aria-label={team.name}
                                value={team.team_id}
                                checked={formData.teams.includes(String(team.team_id))}
                                onChange={handleTeamCheckboxChange}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`team-${team.team_id}`}
                              >
                                {team.name}
                              </label>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Career Statistics */}
                  <div className="col-md-3 stat-box orange">
                    <label className="label" htmlFor="totalRuns">Total Runs</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        min="0"
                        name="totalRuns"
                        id="totalRuns"
                        placeholder="Career Total Runs"
                        value={formData.totalRuns}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 stat-box orange">
                    <label className="label" htmlFor="highestRuns">Highest Runs</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        min="0"
                        name="highestRuns"
                        id="highestRuns"
                        placeholder="Highest Runs in Match"
                        value={formData.highestRuns}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 stat-box orange">
                    <label className="label" htmlFor="wickets">Wickets Taken</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        min="0"
                        name="wickets"
                        id="wickets"
                        placeholder="Wickets Taken"
                        value={formData.wickets}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-3 stat-box orange">
                    <label className="label" htmlFor="outs">Being Out</label>
                    <div className="value p-1">
                      <input
                        className="border-1 ph1"
                        type="number"
                        min="0"
                        name="outs"
                        id="outs"
                        placeholder="Times Out"
                        value={formData.outs}
                        onChange={handleChange}
                      ></input>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-3 w-100">
                    <button
                      className={`btn ${isEdit ? "btn-warning" : "btn-primary"} flex-grow-1 btn-c fw-bold`}
                      type="submit"
                      onClick={handleSubmit}
                    >
                      {isEdit ? "💾 Update Player Details" : "Submit form"}
                    </button>
                    {isEdit && (
                      <>
                        <button
                          type="button"
                          className="btn btn-danger btn-c fw-bold px-4"
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to delete this player? This action cannot be undone and will remove all their images and auction records.")) {
                              try {
                                await api.delete(`/players/${editPlayerId}`);
                                alert("Player deleted successfully");
                                navigate("/players");
                              } catch (err) {
                                alert("Failed to delete player: " + (err.response?.data?.detail || err.message));
                              }
                            }
                          }}
                        >
                          🗑️ Delete Player
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-c fw-bold px-4"
                          onClick={() => navigate(`/player_info/${editPlayerId}`)}
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

export default AdminRegister;
