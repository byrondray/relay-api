export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AddMemberToGroupResponse = {
  __typename?: 'AddMemberToGroupResponse';
  message: Scalars['String']['output'];
};

export type ApprovedCarpooler = {
  __typename?: 'ApprovedCarpooler';
  childFirstName: Scalars['String']['output'];
  parentName: Scalars['String']['output'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  sessionId: Scalars['String']['output'];
};

export type Carpool = {
  __typename?: 'Carpool';
  createdAt: Scalars['String']['output'];
  departureDate: Scalars['String']['output'];
  departureTime: Scalars['String']['output'];
  driverId: Scalars['String']['output'];
  endAddress: Scalars['String']['output'];
  endLat: Scalars['Float']['output'];
  endLon: Scalars['Float']['output'];
  estimatedTime?: Maybe<Scalars['String']['output']>;
  extraCarSeat: Scalars['Boolean']['output'];
  groupId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  startAddress: Scalars['String']['output'];
  startLat: Scalars['Float']['output'];
  startLon: Scalars['Float']['output'];
  tripPreferences?: Maybe<Scalars['String']['output']>;
  vehicleId: Scalars['String']['output'];
  winterTires: Scalars['Boolean']['output'];
};

export type CarpoolWithCarpoolers = {
  __typename?: 'CarpoolWithCarpoolers';
  approvedCarpoolers?: Maybe<Array<ApprovedCarpooler>>;
  departureDate: Scalars['String']['output'];
  departureTime: Scalars['String']['output'];
  driverId: Scalars['String']['output'];
  endAddress: Scalars['String']['output'];
  groupId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  startAddress: Scalars['String']['output'];
  vehicleId: Scalars['String']['output'];
};

export type CarpoolWithDriver = {
  __typename?: 'CarpoolWithDriver';
  createdAt: Scalars['String']['output'];
  departureDate: Scalars['String']['output'];
  departureTime: Scalars['String']['output'];
  driver: User;
  endAddress: Scalars['String']['output'];
  endLat: Scalars['Float']['output'];
  endLon: Scalars['Float']['output'];
  estimatedTime?: Maybe<Scalars['String']['output']>;
  extraCarSeat: Scalars['Boolean']['output'];
  groupId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  requests: Array<RequestWithParentAndChild>;
  startAddress: Scalars['String']['output'];
  startLat: Scalars['Float']['output'];
  startLon: Scalars['Float']['output'];
  tripPreferences?: Maybe<Scalars['String']['output']>;
  vehicle: Vehicle;
  winterTires: Scalars['Boolean']['output'];
};

export type CarpoolWithRequests = {
  __typename?: 'CarpoolWithRequests';
  departureDate: Scalars['String']['output'];
  departureTime: Scalars['String']['output'];
  driverId: Scalars['String']['output'];
  endAddress: Scalars['String']['output'];
  endLat: Scalars['Float']['output'];
  endLon: Scalars['Float']['output'];
  groupId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  requests?: Maybe<Array<RequestWithParentAndChild>>;
  startAddress: Scalars['String']['output'];
  startLat: Scalars['Float']['output'];
  startLon: Scalars['Float']['output'];
  vehicleId: Scalars['String']['output'];
};

export type Child = {
  __typename?: 'Child';
  createdAt: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  schoolEmailAddress?: Maybe<Scalars['String']['output']>;
  schoolId: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type ChildWithParent = {
  __typename?: 'ChildWithParent';
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  parent: User;
  schoolEmailAddress?: Maybe<Scalars['String']['output']>;
  schoolId: Scalars['String']['output'];
};

export type CommunityCenter = {
  __typename?: 'CommunityCenter';
  address: Scalars['String']['output'];
  distance: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  lat: Scalars['Float']['output'];
  lon: Scalars['Float']['output'];
  name: Scalars['String']['output'];
};

export type Conversation = {
  __typename?: 'Conversation';
  messages: Array<DetailedMessage>;
  recipientName: Scalars['String']['output'];
};

export type CreateCarpoolInput = {
  departureDate: Scalars['String']['input'];
  departureTime: Scalars['String']['input'];
  driverChildIds: Array<Scalars['String']['input']>;
  driverId: Scalars['String']['input'];
  endAddress: Scalars['String']['input'];
  endLat: Scalars['Float']['input'];
  endLon: Scalars['Float']['input'];
  extraCarSeat?: InputMaybe<Scalars['Boolean']['input']>;
  groupId: Scalars['String']['input'];
  requestIds: Array<Scalars['String']['input']>;
  startAddress: Scalars['String']['input'];
  startLat: Scalars['Float']['input'];
  startLon: Scalars['Float']['input'];
  tripPreferences?: InputMaybe<Scalars['String']['input']>;
  vehicleId: Scalars['String']['input'];
  winterTires?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateRequestInput = {
  carpoolId?: InputMaybe<Scalars['String']['input']>;
  childIds: Array<Scalars['String']['input']>;
  endingAddress: Scalars['String']['input'];
  endingLat: Scalars['Float']['input'];
  endingLon: Scalars['Float']['input'];
  groupId: Scalars['String']['input'];
  parentId: Scalars['String']['input'];
  pickupTime: Scalars['String']['input'];
  startingAddress: Scalars['String']['input'];
  startingLat: Scalars['Float']['input'];
  startingLon: Scalars['Float']['input'];
};

export type DeleteMemberFromGroupResponse = {
  __typename?: 'DeleteMemberFromGroupResponse';
  message: Scalars['String']['output'];
};

export type DetailedMessage = {
  __typename?: 'DetailedMessage';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  recipient: User;
  sender: User;
  text: Scalars['String']['output'];
};

export type ForegroundNotification = {
  __typename?: 'ForegroundNotification';
  message: Scalars['String']['output'];
  senderId: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type Friend = {
  __typename?: 'Friend';
  city?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  insuranceImageUrl?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  licenseImageUrl?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
};

export type FriendResponse = {
  __typename?: 'FriendResponse';
  message: Scalars['String']['output'];
};

export type FriendsWithUserInfo = {
  __typename?: 'FriendsWithUserInfo';
  createdAt: Scalars['String']['output'];
  friends: Friend;
  id: Scalars['ID']['output'];
  userId: Scalars['String']['output'];
};

export type Group = {
  __typename?: 'Group';
  communityCenterId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  members: Array<User>;
  name: Scalars['String']['output'];
  schoolId?: Maybe<Scalars['String']['output']>;
};

export type GroupMessage = {
  __typename?: 'GroupMessage';
  createdAt: Scalars['String']['output'];
  groupId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  sender: User;
};

export type LocationData = {
  __typename?: 'LocationData';
  lat: Scalars['Float']['output'];
  lon: Scalars['Float']['output'];
  nextStop?: Maybe<NextStop>;
  senderId: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type Message = {
  __typename?: 'Message';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  recipientId: Scalars['String']['output'];
  senderId: Scalars['String']['output'];
  text: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addFriend: FriendResponse;
  addMemberToGroup: AddMemberToGroupResponse;
  approveRequest: Request;
  createCarpool: Carpool;
  createChild: Child;
  createGroup: Group;
  createGroupMessage: GroupMessage;
  createMessage: DetailedMessage;
  createRequest: Request;
  createUser: AuthPayload;
  createVehicle: Vehicle;
  deleteFriend: FriendResponse;
  deleteMemberFromGroup: DeleteMemberFromGroupResponse;
  login: AuthPayload;
  sendLocation?: Maybe<LocationData>;
  updateExpoPushToken: User;
  updateUserInfo: User;
};


export type MutationAddFriendArgs = {
  friendId: Scalars['String']['input'];
};


export type MutationAddMemberToGroupArgs = {
  groupId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationApproveRequestArgs = {
  requestId: Scalars['String']['input'];
};


export type MutationCreateCarpoolArgs = {
  input: CreateCarpoolInput;
};


export type MutationCreateChildArgs = {
  firstName: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  schoolEmailAddress?: InputMaybe<Scalars['String']['input']>;
  schoolName: Scalars['String']['input'];
};


export type MutationCreateGroupArgs = {
  communityCenterId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  schoolId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateGroupMessageArgs = {
  groupId: Scalars['String']['input'];
  message: Scalars['String']['input'];
};


export type MutationCreateMessageArgs = {
  recipientId: Scalars['String']['input'];
  senderId: Scalars['String']['input'];
  text: Scalars['String']['input'];
};


export type MutationCreateRequestArgs = {
  input: CreateRequestInput;
};


export type MutationCreateUserArgs = {
  email: Scalars['String']['input'];
  expoPushToken?: InputMaybe<Scalars['String']['input']>;
  firebaseId: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateVehicleArgs = {
  color: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  licensePlate: Scalars['String']['input'];
  make: Scalars['String']['input'];
  model: Scalars['String']['input'];
  seats: Scalars['Int']['input'];
  year: Scalars['String']['input'];
};


export type MutationDeleteFriendArgs = {
  friendId: Scalars['String']['input'];
};


export type MutationDeleteMemberFromGroupArgs = {
  groupId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  expoPushToken?: InputMaybe<Scalars['String']['input']>;
  firebaseId: Scalars['String']['input'];
};


export type MutationSendLocationArgs = {
  carpoolId: Scalars['String']['input'];
  isFinalDestination: Scalars['Boolean']['input'];
  isLeaving: Scalars['Boolean']['input'];
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
  nextStop: NextStopInput;
  timeToNextStop: Scalars['String']['input'];
  timeUntilNextStop: Scalars['String']['input'];
  totalTime: Scalars['String']['input'];
};


export type MutationUpdateExpoPushTokenArgs = {
  expoPushToken: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationUpdateUserInfoArgs = {
  city?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  insuranceImageUrl?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  licenseImageUrl?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type NextStop = {
  __typename?: 'NextStop';
  address: Scalars['String']['output'];
  requestId: Scalars['String']['output'];
};

export type NextStopInput = {
  address: Scalars['String']['input'];
  requestId: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  filterSchoolsByName: Array<School>;
  getCarpoolWithRequests: CarpoolWithRequests;
  getCarpoolersByGroupWithoutApprovedRequests?: Maybe<Array<RequestWithChildrenAndParent>>;
  getCarpoolsByGroup?: Maybe<Array<Carpool>>;
  getCarpoolsByGroupsWithApprovedCarpoolers?: Maybe<Array<CarpoolWithCarpoolers>>;
  getChild?: Maybe<Child>;
  getChildren: Array<Child>;
  getChildrenForUser: Array<Child>;
  getCommunityCenters: Array<CommunityCenter>;
  getConversationsForUser: Array<Conversation>;
  getCurrentCarpools?: Maybe<Array<Carpool>>;
  getFriend: FriendsWithUserInfo;
  getFriends: Array<FriendsWithUserInfo>;
  getGroup?: Maybe<Group>;
  getGroupMessages: Array<GroupMessage>;
  getGroupWithUsers: Group;
  getGroups: Array<Group>;
  getPastCarpools?: Maybe<Array<Carpool>>;
  getPrivateMessageConversation: Array<DetailedMessage>;
  getUser?: Maybe<User>;
  getUserCarpoolsAndRequests: UserCarpoolsAndRequests;
  getUsers: Array<User>;
  getVehicle?: Maybe<Vehicle>;
  getVehicleForUser: Array<Vehicle>;
  hasUserOnBoarded: Scalars['Boolean']['output'];
};


export type QueryFilterSchoolsByNameArgs = {
  name: Scalars['String']['input'];
};


export type QueryGetCarpoolWithRequestsArgs = {
  carpoolId: Scalars['String']['input'];
};


export type QueryGetCarpoolersByGroupWithoutApprovedRequestsArgs = {
  date: Scalars['String']['input'];
  endingAddress: Scalars['String']['input'];
  groupId: Scalars['String']['input'];
  time: Scalars['String']['input'];
};


export type QueryGetCarpoolsByGroupArgs = {
  groupId: Scalars['String']['input'];
};


export type QueryGetCarpoolsByGroupsWithApprovedCarpoolersArgs = {
  groupId: Scalars['String']['input'];
};


export type QueryGetChildArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCommunityCentersArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryGetConversationsForUserArgs = {
  userId: Scalars['String']['input'];
};


export type QueryGetCurrentCarpoolsArgs = {
  userId: Scalars['String']['input'];
};


export type QueryGetFriendArgs = {
  friendId: Scalars['String']['input'];
};


export type QueryGetGroupArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetGroupMessagesArgs = {
  groupId: Scalars['String']['input'];
};


export type QueryGetGroupWithUsersArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPastCarpoolsArgs = {
  userId: Scalars['String']['input'];
};


export type QueryGetPrivateMessageConversationArgs = {
  recipientId: Scalars['String']['input'];
  senderId: Scalars['String']['input'];
};


export type QueryGetUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserCarpoolsAndRequestsArgs = {
  userId: Scalars['String']['input'];
};


export type QueryGetVehicleArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetVehicleForUserArgs = {
  userId: Scalars['String']['input'];
};

export type Request = {
  __typename?: 'Request';
  carpoolId?: Maybe<Scalars['String']['output']>;
  children: Array<Child>;
  createdAt: Scalars['String']['output'];
  endAddress: Scalars['String']['output'];
  endingLat: Scalars['Float']['output'];
  endingLon: Scalars['Float']['output'];
  groupId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  isApproved: Scalars['Boolean']['output'];
  parentId: Scalars['String']['output'];
  pickupTime: Scalars['String']['output'];
  startAddress: Scalars['String']['output'];
  startingLat: Scalars['Float']['output'];
  startingLon: Scalars['Float']['output'];
};

export type RequestWithChildrenAndParent = {
  __typename?: 'RequestWithChildrenAndParent';
  carpoolId?: Maybe<Scalars['String']['output']>;
  children: Array<ChildWithParent>;
  createdAt: Scalars['String']['output'];
  endAddress: Scalars['String']['output'];
  endingLat: Scalars['String']['output'];
  endingLon: Scalars['String']['output'];
  groupId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isApproved: Scalars['Int']['output'];
  parentId: Scalars['String']['output'];
  pickupTime: Scalars['String']['output'];
  startAddress: Scalars['String']['output'];
  startingLat: Scalars['String']['output'];
  startingLon: Scalars['String']['output'];
};

export type RequestWithParentAndChild = {
  __typename?: 'RequestWithParentAndChild';
  carpoolId?: Maybe<Scalars['String']['output']>;
  child: Child;
  id: Scalars['String']['output'];
  parent: User;
  pickupTime: Scalars['String']['output'];
  startAddress: Scalars['String']['output'];
  startLat: Scalars['Float']['output'];
  startLon: Scalars['Float']['output'];
};

export type School = {
  __typename?: 'School';
  address: Scalars['String']['output'];
  city: Scalars['String']['output'];
  districtNumber: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  foregroundNotification?: Maybe<ForegroundNotification>;
  groupMessageSent: GroupMessage;
  locationReceived?: Maybe<LocationData>;
  messageSent: DetailedMessage;
};


export type SubscriptionForegroundNotificationArgs = {
  recipientId: Scalars['String']['input'];
};


export type SubscriptionGroupMessageSentArgs = {
  groupId: Scalars['String']['input'];
};


export type SubscriptionLocationReceivedArgs = {
  recipientId: Scalars['String']['input'];
};


export type SubscriptionMessageSentArgs = {
  recipientId: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  city?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  expoPushToken?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  insuranceImageUrl?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  licenseImageUrl?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
};

export type UserCarpoolsAndRequests = {
  __typename?: 'UserCarpoolsAndRequests';
  carpools: Array<CarpoolWithDriver>;
  requests: Array<RequestWithParentAndChild>;
};

export type Vehicle = {
  __typename?: 'Vehicle';
  color: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  licensePlate: Scalars['String']['output'];
  make: Scalars['String']['output'];
  model: Scalars['String']['output'];
  seats: Scalars['Int']['output'];
  userId: Scalars['String']['output'];
  vehicleImageUrl?: Maybe<Scalars['String']['output']>;
  year: Scalars['String']['output'];
};
