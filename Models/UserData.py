import clr
import System
import ServiceDesk
import BaseModel

import Newtonsoft.Json.Linq as J
xstr = ServiceDesk.Common.ConvertToString
xint = ServiceDesk.Common.ConvertToInt
def cleanUpCode(code):
    return code
    # return code.replace('<script>','<uiscript>').replace('</script>','</uiscript>')
class Model(BaseModel.Model):
    def __init__(self, *args):
        BaseModel.Model.__init__(self,*args)

    def ExecuteDashboard(self,args,env):
        root = ServiceDesk.Configuration.ReadValue('UseCaseManager.UseCasePath')
        if not args.ContainsKey('UserKey'): raise Exception('User key not specified')
        dashboardJSON = self.account.DBService().ExecuteScalar('select top 1 [Dashboard] from UXPUserData where UserKey=@UserKey',{'UserKey':args['UserKey']})
        dashboardJSON = xstr(dashboardJSON)
        if not dashboardJSON:
            return []
        useCaseCards = {}

        items = J.JArray.Parse(dashboardJSON)
        cards = []
        for item in items:
            id = xstr(item['id'])
            col = xstr(item['col'])
            row = xstr(item['row'])
            width = xstr(item['width'])
            height = xstr(item['height'])
            t = xstr(item['type'])
            card = {'ID':id,'Col':col,'Row':row,'Type':t,'Width':width,'Height':height}
            if t == 'usecase':
                useCaseCards.setdefault(id,[]).append(card)
            cards.append(card)
        
        useCaseIDs = "'" + "','".join(useCaseCards.keys()) + "'"
        sql = '''select C.Code,X.ID + '/' + C.ID as ID,X.ID as UseCaseID, C.ID as CardID
        from UseCaseCards C,UseCaseMaster X where C.UseCaseKey = X.[Key]
        and X.ID + '/' + C.ID in (
        ''' + useCaseIDs + ')'

        dtb = self.account.DBService().ExecuteQuery(sql)
        for dr in dtb.Rows:
            id = xstr(dr['ID'])
            code = xstr(dr['Code'])
            if root:
                cardID = xstr(dr['CardID'])
                useCaseID = xstr(dr['UseCaseID'])
                cardPath = System.IO.Path.Combine(root,useCaseID,'html',cardID+'.html')

                # if System.IO.File.Exists(cardPath):
                code = ServiceDesk.Common.ReadFromFile(cardPath)
                # raise Exception(code)
            for card in useCaseCards[id]:
                card['Code'] = cleanUpCode(code)
        return cards
    def ExecuteAllCards(self,args,env):
        sql = '''
        select M.ID + '/' + C.ID as ID,C.Name as Name,M.IconUrl as Icon
        from
        UseCaseMaster M
        ,UseCaseCards C
        where
        M.[Key] = C.UseCaseKey
        order by C.Name desc
        '''
        return self.account.DBService().ExecuteQuery(sql)
            


        
